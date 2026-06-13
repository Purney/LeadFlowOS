import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Campaign } from "@/models/campaign";
import { CampaignEnrollment } from "@/models/campaign-enrollment";
import { EmailAccount } from "@/models/email-account";
import { EmailEvent } from "@/models/email-event";
import { EmailMessage } from "@/models/email-message";
import { Lead } from "@/models/lead";
import { Organisation } from "@/models/organisation";
import { SendBatch } from "@/models/send-batch";
import { SetupLock } from "@/models/setup-lock";
import { Suppression } from "@/models/suppression";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import { createCampaign, enrollLeadsInCampaign } from "@/services/campaign-service";
import {
  getEmailMetrics,
  processApprovedSendBatch,
  processInboundReply,
  processMailgunEvents,
} from "@/services/email-service";
import { createLead } from "@/services/lead-service";
import { createEmailAccount, generateSendBatch, updateSendBatch } from "@/services/sending-service";
import { createSuppression } from "@/services/suppression-service";

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
    provider: "mailgun",
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
  const batchResult = await generateSendBatch(context, {
    campaignId: campaign._id.toString(),
    sendingAccountId: account._id.toString(),
    limit: 10,
  });
  const batch = await updateSendBatch(context, batchResult?.batch?._id.toString() ?? "", {
    status: "approved",
  });

  return { lead, campaign, account, batch };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all([
    ActivityLog.deleteMany({}),
    EmailEvent.deleteMany({}),
    EmailMessage.deleteMany({}),
    Suppression.deleteMany({}),
    SendBatch.deleteMany({}),
    EmailAccount.deleteMany({}),
    CampaignEnrollment.deleteMany({}),
    Campaign.deleteMany({}),
    Lead.deleteMany({}),
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

describe("email service", () => {
  it("dry-runs approved batches and skips suppressed recipients", async () => {
    const { batch } = await bootstrapScenario();
    await createSuppression(context, {
      email: "grace@example.com",
      reason: "manual_suppression",
    });

    const result = await processApprovedSendBatch(
      context,
      batch?._id.toString() ?? "",
      { dryRun: true },
    );

    expect(result).toEqual({ sent: 0, queued: 0, suppressed: 1 });
    await expect(EmailMessage.countDocuments({})).resolves.toBe(0);
  });

  it("processes Mailgun events and creates suppressions", async () => {
    await bootstrapScenario();
    const message = await EmailMessage.create({
      organisationId: context.organisationId,
      direction: "outbound",
      status: "sent",
      provider: "mailgun",
      providerMessageId: "mailgun_123",
      from: "outreach@example.com",
      to: "grace@example.com",
      subject: "Hello",
      body: "Hi",
    });

    const result = await processMailgunEvents(context.organisationId, [
      {
        event: "failed",
        recipient: "grace@example.com",
        message: { headers: { "message-id": "mailgun_123" } },
        timestamp: 1_812_844_800,
        reason: "Mailbox unavailable",
      },
    ]);

    expect(result.processed).toBe(1);
    await expect(EmailEvent.countDocuments({ eventType: "failed" })).resolves.toBe(1);
    await expect(Suppression.countDocuments({ reason: "bounced" })).resolves.toBe(1);
    const updated = await EmailMessage.findById(message._id);
    expect(updated?.status).toBe("bounced");
  });

  it("matches inbound replies, updates lead status, and pauses enrollments", async () => {
    const { lead } = await bootstrapScenario();

    const result = await processInboundReply(context.organisationId, {
      from: "Grace Hopper <grace@example.com>",
      to: "outreach@example.com",
      subject: "Re: Idea",
      text: "Interested.",
    });

    expect(result.matchedLead).toBe(true);
    const updatedLead = await Lead.findById(lead._id);
    expect(updatedLead?.status).toBe("replied");
    await expect(
      CampaignEnrollment.countDocuments({ leadId: lead._id, status: "replied" }),
    ).resolves.toBe(1);
    await expect(getEmailMetrics(context.organisationId)).resolves.toMatchObject({
      replies: 1,
    });
  });
});
