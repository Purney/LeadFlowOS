import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Deal } from "@/models/deal";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { LifecycleTimelineEvent } from "@/models/lifecycle-timeline-event";
import { Organisation } from "@/models/organisation";
import { SalesTask } from "@/models/sales-task";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  createDeal,
  createSalesTask,
  getSalesMetrics,
  updateDeal,
  updateSalesTask,
} from "@/services/sales-service";

let mongo: MongoMemoryServer;
let context: { organisationId: string; userId: string };

async function bootstrapOwner() {
  const result = await createFirstOwner({
    ownerName: "Ada Lovelace",
    organisationName: "LeadFlow OS",
    email: "ada@example.com",
    password: "CorrectHorse12",
  });

  context = {
    organisationId: result.organisation._id.toString(),
    userId: result.user._id.toString(),
  };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  await Promise.all([
    ActivityLog.deleteMany({}),
    SalesTask.deleteMany({}),
    Deal.deleteMany({}),
    LifecycleTimelineEvent.deleteMany({}),
    LifecycleAccount.deleteMany({}),
    SetupLock.deleteMany({}),
    Organisation.deleteMany({}),
    User.deleteMany({}),
  ]);
  process.env.ALLOW_ADDITIONAL_ORG_SIGNUPS = "false";
});

afterAll(async () => {
  await disconnectFromDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

describe("sales service", () => {
  it("creates deals, syncs lifecycle, and calculates weighted pipeline", async () => {
    await bootstrapOwner();
    const deal = await createDeal(context, {
      title: "Automation rollout",
      companyName: "Compiler Labs",
      contactEmail: "buyer@example.com",
      valueCents: 2000000,
      probability: 50,
      stage: "proposal_sent",
      status: "active",
    });

    expect(deal?.stage).toBe("proposal_sent");
    const account = await LifecycleAccount.findById(deal?.lifecycleAccountId).lean();
    expect(account?.stage).toBe("proposal_sales");

    const metrics = await getSalesMetrics(context.organisationId);
    expect(metrics.activeDeals).toBe(1);
    expect(metrics.totalValueCents).toBe(2000000);
    expect(metrics.weightedValueCents).toBe(1000000);
  });

  it("moves won deals into onboarding and completes sales tasks", async () => {
    await bootstrapOwner();
    const deal = await createDeal(context, {
      title: "Discovery project",
      companyName: "Client Co",
      valueCents: 1000000,
      probability: 80,
      stage: "negotiation",
      status: "active",
    });
    expect(deal).not.toBeNull();

    const task = await createSalesTask(context, {
      dealId: deal!._id.toString(),
      title: "Send final scope",
      status: "open",
    });
    expect(task?.status).toBe("open");

    const won = await updateDeal(context, deal!._id.toString(), {
      stage: "won",
      wonReason: "Accepted proposal",
    });
    const completed = await updateSalesTask(context, task!._id.toString(), {
      status: "completed",
    });
    const account = await LifecycleAccount.findById(won?.lifecycleAccountId).lean();

    expect(won?.status).toBe("won");
    expect(account?.stage).toBe("onboarding_payment");
    expect(completed?.status).toBe("completed");
  });
});
