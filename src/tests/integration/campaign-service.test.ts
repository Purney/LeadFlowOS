import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Campaign } from "@/models/campaign";
import { CampaignEnrollment } from "@/models/campaign-enrollment";
import { Lead } from "@/models/lead";
import { Organisation } from "@/models/organisation";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  createCampaign,
  enrollLeadsInCampaign,
  getCampaignMetrics,
  listCampaigns,
  updateCampaign,
} from "@/services/campaign-service";
import { createLead } from "@/services/lead-service";

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

describe("campaign service", () => {
  it("creates and updates campaign sequences", async () => {
    await bootstrapOwner();
    const campaign = await createCampaign(context, {
      name: "AI audit outreach",
      goal: "Book discovery calls",
      serviceOffer: "AI automation audit",
      status: "draft",
      steps: [
        {
          name: "Initial outreach",
          delayDays: 0,
          subjectVariants: ["Idea for {{company}}", "Quick question"],
          bodyVariants: ["Hi {{firstName}}"],
        },
        {
          name: "Follow-up",
          delayDays: 3,
          subjectVariants: ["Worth revisiting?"],
          bodyVariants: ["Following up, {{firstName}}"],
        },
      ],
    });

    expect(campaign.steps).toHaveLength(2);
    expect(campaign.steps[1].order).toBe(1);

    const updated = await updateCampaign(context, campaign._id.toString(), {
      status: "active",
    });
    expect(updated?.status).toBe("active");

    const metrics = await getCampaignMetrics(context.organisationId);
    expect(metrics).toEqual({ total: 1, active: 1 });
  });

  it("enrolls leads with deterministic first-step variants", async () => {
    await bootstrapOwner();
    const lead = await createLead(context, {
      email: "grace@example.com",
      firstName: "Grace",
      company: "Compiler Labs",
      tags: [],
      status: "new",
      customFields: {},
    });
    const campaign = await createCampaign(context, {
      name: "Consulting outreach",
      status: "draft",
      steps: [
        {
          name: "Initial outreach",
          delayDays: 2,
          subjectVariants: ["A", "B"],
          bodyVariants: ["One", "Two"],
        },
      ],
    });

    const result = await enrollLeadsInCampaign(
      context,
      campaign._id.toString(),
      {
        leadIds: [lead._id.toString()],
        startAt: new Date("2026-06-11T00:00:00.000Z"),
      },
    );

    expect(result?.created).toBe(1);
    expect(result?.nextScheduledAt.toISOString()).toBe(
      "2026-06-13T00:00:00.000Z",
    );

    const campaigns = await listCampaigns(context.organisationId);
    expect(campaigns[0].enrollmentCount).toBe(1);

    const duplicate = await enrollLeadsInCampaign(
      context,
      campaign._id.toString(),
      { leadIds: [lead._id.toString()] },
    );
    expect(duplicate?.created).toBe(0);
    expect(duplicate?.skippedExisting).toBe(1);
  });
});
