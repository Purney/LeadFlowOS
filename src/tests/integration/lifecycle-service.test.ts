import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { LifecycleTimelineEvent } from "@/models/lifecycle-timeline-event";
import { Organisation } from "@/models/organisation";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  createLifecycleAccount,
  getLifecycleMetrics,
  listLifecycleAccounts,
  listRecentLifecycleTimeline,
  moveLifecycleAccountStage,
} from "@/services/lifecycle-service";

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

describe("lifecycle service", () => {
  it("creates accounts, moves stages, and reports lifecycle metrics", async () => {
    await bootstrapOwner();
    const account = await createLifecycleAccount(context, {
      name: "Compiler Labs",
      primaryEmail: "hello@compiler.example",
      website: "https://compiler.example",
      stage: "client_research",
      status: "active",
      fitScore: 90,
      tags: ["research", "research"],
    });

    expect(account.name).toBe("Compiler Labs");
    expect(account.tags).toEqual(["research"]);

    const moved = await moveLifecycleAccountStage(
      context,
      account._id.toString(),
      {
        stage: "proposal_sales",
        status: "at_risk",
        nextAction: "Send revised scope",
        nextActionDueAt: new Date("2026-06-12T00:00:00.000Z"),
        note: "Discovery completed.",
      },
    );

    expect(moved?.stage).toBe("proposal_sales");
    expect(moved?.status).toBe("at_risk");

    const listed = await listLifecycleAccounts(context.organisationId, {
      stage: "proposal_sales",
      status: "all",
    });
    const metrics = await getLifecycleMetrics(context.organisationId);
    const timeline = await listRecentLifecycleTimeline(context.organisationId);

    expect(listed).toHaveLength(1);
    expect(listed[0].nextAction).toBe("Send revised scope");
    expect(metrics.total).toBe(1);
    expect(metrics.byStage.proposal_sales).toBe(1);
    expect(metrics.byStatus.at_risk).toBe(1);
    expect(timeline.map((event) => event.action)).toContain(
      "lifecycle.stage_changed",
    );
  });
});
