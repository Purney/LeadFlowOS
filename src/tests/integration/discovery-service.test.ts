import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { AiDraft } from "@/models/ai-draft";
import { DiscoveryForm } from "@/models/discovery-form";
import { DiscoveryResponse } from "@/models/discovery-response";
import { Lead } from "@/models/lead";
import { Organisation } from "@/models/organisation";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  createDiscoveryForm,
  generateDiscoverySummary,
  getDiscoveryMetrics,
  submitDiscoveryResponse,
} from "@/services/discovery-service";
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
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  await Promise.all([
    ActivityLog.deleteMany({}),
    AiDraft.deleteMany({}),
    DiscoveryResponse.deleteMany({}),
    DiscoveryForm.deleteMany({}),
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

describe("discovery service", () => {
  it("creates public forms and accepts valid responses", async () => {
    await bootstrapOwner();
    const lead = await createLead(context, {
      email: "grace@example.com",
      firstName: "Grace",
      tags: [],
      customFields: {},
    });
    const form = await createDiscoveryForm(context, {
      name: "Project discovery",
      status: "published",
      fields: [
        {
          id: "objective",
          label: "Objective",
          type: "long_text",
          required: true,
          options: [],
        },
      ],
    });

    const result = await submitDiscoveryResponse(form.publicSlug, {
      leadId: lead._id.toString(),
      respondentEmail: "grace@example.com",
      answers: { objective: "Automate reporting" },
    });

    expect("response" in (result ?? {})).toBe(true);
    await expect(DiscoveryResponse.countDocuments({})).resolves.toBe(1);
    const updatedLead = await Lead.findById(lead._id);
    expect(updatedLead?.status).toBe("qualified");
    await expect(getDiscoveryMetrics(context.organisationId)).resolves.toEqual({
      forms: 1,
      responses: 1,
    });
  });

  it("rejects invalid public responses", async () => {
    await bootstrapOwner();
    const form = await createDiscoveryForm(context, {
      name: "Project discovery",
      status: "published",
      fields: [
        {
          id: "budget",
          label: "Budget",
          type: "number",
          required: true,
          options: [],
        },
      ],
    });

    const result = await submitDiscoveryResponse(form.publicSlug, {
      answers: { budget: "not-a-number" },
    });

    expect(result).toEqual({ errors: ["Budget must be a number."] });
  });

  it("generates AI discovery summaries", async () => {
    await bootstrapOwner();
    const form = await createDiscoveryForm(context, {
      name: "Project discovery",
      status: "published",
      fields: [
        {
          id: "objective",
          label: "Objective",
          type: "long_text",
          required: true,
          options: [],
        },
      ],
    });
    const responseResult = await submitDiscoveryResponse(form.publicSlug, {
      respondentEmail: "client@example.com",
      answers: { objective: "Automate reporting" },
    });
    const response =
      responseResult && "response" in responseResult ? responseResult.response : null;

    const draft = await generateDiscoverySummary(
      context,
      { responseId: response?._id.toString() ?? "" },
      {
        generateText: async () =>
          JSON.stringify({
            objectives: ["Automate reporting"],
            painPoints: ["Manual reporting"],
            risks: ["Data quality"],
            opportunities: ["Save time"],
            recommendedScope: ["Build reporting workflow"],
          }),
      },
    );

    expect(draft?.type).toBe("discovery_summary");
    expect(draft?.content.objectives).toEqual(["Automate reporting"]);
    await expect(AiDraft.countDocuments({ type: "discovery_summary" })).resolves.toBe(1);
  });
});
