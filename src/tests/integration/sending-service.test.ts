import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Campaign } from "@/models/campaign";
import { CampaignEnrollment } from "@/models/campaign-enrollment";
import { EmailAccount } from "@/models/email-account";
import { Lead } from "@/models/lead";
import { Organisation } from "@/models/organisation";
import { SendBatch } from "@/models/send-batch";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  createCampaign,
  enrollLeadsInCampaign,
} from "@/services/campaign-service";
import { createLead } from "@/services/lead-service";
import {
  createEmailAccount,
  generateSendBatch,
  getSendingMetrics,
  updateSendBatch,
} from "@/services/sending-service";

let mongo: MongoMemoryServer;
let context: { organisationId: string; userId: string };

async function bootstrapScenario() {
  const owner = await createFirstOwner({
    ownerName: "Ada Lovelace",
    organisationName: "LeadFlow OS",
    email: "ada@example.com",
    password: "CorrectHorse12",
  });
  context = {
    organisationId: owner.organisation._id.toString(),
    userId: owner.user._id.toString(),
  };
  const lead = await createLead(context, {
    email: "grace@example.com",
    firstName: "Grace",
    company: "Compiler Labs",
    tags: [],
    status: "new",
    customFields: {},
  });
  const campaign = await createCampaign(context, {
    name: "AI audit",
    status: "active",
    steps: [
      {
        name: "Initial",
        delayDays: 0,
        subjectVariants: ["Idea for {{company}}"],
        bodyVariants: ["Hi {{firstName}}"],
      },
    ],
  });
  await enrollLeadsInCampaign(context, campaign._id.toString(), {
    leadIds: [lead._id.toString()],
    startAt: new Date("2026-06-11T00:00:00.000Z"),
  });
  const account = await createEmailAccount(context, {
    email: "outreach@example.com",
    domain: "example.com",
    provider: "sendgrid",
    verificationStatus: "verified",
    dailySendLimit: 25,
    warmupStatus: "ready",
    active: true,
    health: {
      spfConfigured: true,
      dkimConfigured: true,
      dmarcConfigured: true,
      trackingDomainConfigured: true,
      unsubscribeSupported: true,
      bounceRate: 0,
      spamComplaintRate: 0,
    },
  });

  return { campaign, account };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all([
    ActivityLog.deleteMany({}),
    SendBatch.deleteMany({}),
    EmailAccount.deleteMany({}),
    CampaignEnrollment.deleteMany({}),
    Campaign.deleteMany({}),
    Lead.deleteMany({}),
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

describe("sending service", () => {
  it("creates sending accounts and computes metrics", async () => {
    await bootstrapScenario();

    const metrics = await getSendingMetrics(context.organisationId);

    expect(metrics.accounts).toBe(1);
    expect(metrics.activeAccounts).toBe(1);
    expect(metrics.averageHealth).toBe(100);
  });

  it("generates pending approval batches and supports approval", async () => {
    vi.setSystemTime(new Date("2026-06-11T00:00:00.000Z"));
    const { campaign, account } = await bootstrapScenario();

    const result = await generateSendBatch(context, {
      campaignId: campaign._id.toString(),
      sendingAccountId: account._id.toString(),
      limit: 10,
    });

    expect(result?.created).toBe(1);
    expect(result?.batch?.status).toBe("pending_approval");
    expect(result?.batch?.subject).toBe("Idea for Compiler Labs");
    expect(result?.batch?.body).toBe("Hi Grace");

    const approved = await updateSendBatch(
      context,
      result?.batch?._id.toString() ?? "",
      { status: "approved" },
    );

    expect(approved?.status).toBe("approved");
    expect(approved?.approvedByUserId?.toString()).toBe(context.userId);
  });
});
