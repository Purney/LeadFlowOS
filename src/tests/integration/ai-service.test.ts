import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { AiDraft } from "@/models/ai-draft";
import { EmailMessage } from "@/models/email-message";
import { Lead } from "@/models/lead";
import { Organisation } from "@/models/organisation";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { generateColdEmailDraft, generateReplyDraft } from "@/services/ai-service";
import { createFirstOwner } from "@/services/auth-service";
import { createLead } from "@/services/lead-service";

let mongo: MongoMemoryServer;
let context: { organisationId: string; userId: string };

async function bootstrapOwner() {
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

  return createLead(context, {
    email: "grace@example.com",
    firstName: "Grace",
    company: "Compiler Labs",
    website: "https://compiler.example",
    tags: [],
    status: "replied",
    customFields: {},
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  await Promise.all([
    ActivityLog.deleteMany({}),
    AiDraft.deleteMany({}),
    EmailMessage.deleteMany({}),
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

describe("AI service", () => {
  it("generates and stores cold email drafts", async () => {
    const lead = await bootstrapOwner();

    const draft = await generateColdEmailDraft(
      context,
      {
        leadId: lead._id.toString(),
        serviceOffer: "AI automation audit",
        campaignGoal: "Book discovery calls",
      },
      {
        model: "test-model",
        generateText: async () =>
          JSON.stringify({
            subjects: ["Idea for Compiler Labs"],
            body: "Hi Grace, quick idea.",
            followUps: ["Worth a look?", "Should I close the loop?"],
          }),
      },
    );

    expect(draft?.type).toBe("cold_email");
    expect(draft?.content.subjects).toEqual(["Idea for Compiler Labs"]);
    await expect(AiDraft.countDocuments({ type: "cold_email" })).resolves.toBe(1);
  });

  it("generates and stores reply drafts from conversation history", async () => {
    const lead = await bootstrapOwner();
    await EmailMessage.create({
      organisationId: context.organisationId,
      leadId: lead._id,
      direction: "inbound",
      status: "replied",
      from: "grace@example.com",
      to: "outreach@example.com",
      subject: "Re: Idea",
      body: "Interested.",
    });

    const draft = await generateReplyDraft(
      context,
      { leadId: lead._id.toString() },
      {
        generateText: async () =>
          JSON.stringify({
            summary: "Grace is interested.",
            suggestedResponse: "Thanks Grace, happy to compare notes.",
          }),
      },
    );

    expect(draft?.type).toBe("reply");
    expect(draft?.content.summary).toBe("Grace is interested.");
    await expect(AiDraft.countDocuments({ type: "reply" })).resolves.toBe(1);
  });
});
