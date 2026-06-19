import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Lead } from "@/models/lead";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { LifecycleTimelineEvent } from "@/models/lifecycle-timeline-event";
import { Organisation } from "@/models/organisation";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  createLead,
  deleteLead,
  getLeadMetrics,
  importLeads,
  listLeads,
  updateLead,
} from "@/services/lead-service";

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

describe("lead service", () => {
  it("creates, lists, filters, updates, and deletes leads", async () => {
    await bootstrapOwner();
    const lead = await createLead(context, {
      email: "grace@example.com",
      firstName: "Grace",
      lastName: "Hopper",
      company: "Compiler Labs",
      tags: ["ai", "navy", "ai"],
      customFields: {},
    });
    expect(lead.status).toBe("discovery_booked");

    const listed = await listLeads(context, { search: "compiler", tag: "ai" });
    expect(listed).toHaveLength(1);
    expect(listed[0].tags).toEqual(["ai", "navy"]);

    const updated = await updateLead(context, lead._id.toString(), {
      status: "qualified",
    });
    expect(updated?.status).toBe("qualified");
    const account = await LifecycleAccount.findOne({ leadId: lead._id }).lean();
    expect(account?.stage).toBe("proposal_sales");

    const metrics = await getLeadMetrics(context.organisationId);
    expect(metrics.total).toBe(1);
    expect(metrics.byStatus.qualified).toBe(1);

    await expect(deleteLead(context, lead._id.toString())).resolves.toBe(true);
    await expect(listLeads(context)).resolves.toHaveLength(0);
  });

  it("imports CSV leads and skips duplicates", async () => {
    await bootstrapOwner();
    await createLead(context, {
      email: "existing@example.com",
      tags: [],
      customFields: {},
    });

    const result = await importLeads(context, {
      source: "Apollo",
      csv: [
        "firstName,lastName,email,company,tags",
        "Ada,Lovelace,ada@example.com,Engines,ai;automation",
        "Existing,Lead,existing@example.com,Already Here,",
        "Ada,Again,ada@example.com,Duplicate,",
        "Bad,Email,not-an-email,Broken,",
      ].join("\n"),
    });

    expect(result.parsed).toBe(4);
    expect(result.created).toBe(1);
    expect(result.skippedInvalid).toBe(1);
    expect(result.skippedDuplicates.sort()).toEqual([
      "ada@example.com",
      "existing@example.com",
    ]);
  });
});
