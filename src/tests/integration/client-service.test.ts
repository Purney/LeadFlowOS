import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Client } from "@/models/client";
import { Lead } from "@/models/lead";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { LifecycleTimelineEvent } from "@/models/lifecycle-timeline-event";
import { Organisation } from "@/models/organisation";
import { Project } from "@/models/project";
import { SetupLock } from "@/models/setup-lock";
import { TimeEntry } from "@/models/time-entry";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  convertLeadToClient,
  createProject,
  createTimeEntry,
  getClientProjectMetrics,
  listClients,
  updateProject,
} from "@/services/client-service";
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
    LifecycleTimelineEvent.deleteMany({}),
    LifecycleAccount.deleteMany({}),
    TimeEntry.deleteMany({}),
    Project.deleteMany({}),
    SetupLock.deleteMany({}),
    Client.deleteMany({}),
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

describe("client service", () => {
  it("converts a lead into a client and marks the lead as won", async () => {
    await bootstrapOwner();
    const lead = await createLead(context, {
      email: "grace@example.com",
      firstName: "Grace",
      lastName: "Hopper",
      company: "Compiler Labs",
      role: "CTO",
      tags: [],
      notes: "Ready for delivery",
      status: "qualified",
      customFields: {},
    });

    const client = await convertLeadToClient(context, {
      leadId: lead._id.toString(),
      stripeCustomerId: "cus_123",
    });
    const updatedLead = await Lead.findById(lead._id).lean();
    const clients = await listClients(context.organisationId);

    expect(client?.company).toBe("Compiler Labs");
    expect(client?.stripeCustomerId).toBe("cus_123");
    expect(updatedLead?.status).toBe("won");
    const account = await LifecycleAccount.findOne({ clientId: client!._id }).lean();
    expect(account?.stage).toBe("onboarding_payment");
    expect(account?.status).toBe("won");
    expect(clients).toHaveLength(1);
    await expect(
      ActivityLog.countDocuments({ action: "client.converted_from_lead" }),
    ).resolves.toBe(1);
  });

  it("creates projects, logs time, and calculates delivery metrics", async () => {
    await bootstrapOwner();
    const lead = await createLead(context, {
      email: "client@example.com",
      company: "Client Co",
      tags: [],
      status: "qualified",
      customFields: {},
    });
    const client = await convertLeadToClient(context, {
      leadId: lead._id.toString(),
    });

    expect(client).not.toBeNull();

    const project = await createProject(context, {
      clientId: client!._id.toString(),
      name: "Automation rollout",
      type: "automation",
      status: "active",
      estimatedValue: 15000,
      actualRevenue: 9000,
    });

    expect(project?.status).toBe("active");
    const executionAccount = await LifecycleAccount.findOne({
      clientId: client!._id,
    }).lean();
    expect(executionAccount?.stage).toBe("solution_execution");

    const entry = await createTimeEntry(context, {
      clientId: client!._id.toString(),
      projectId: project!._id.toString(),
      date: new Date("2026-06-11T00:00:00.000Z"),
      minutes: 180,
      description: "Implementation workshop",
    });
    const metrics = await getClientProjectMetrics(context.organisationId);

    expect(entry?.minutes).toBe(180);
    expect(metrics.clients).toBe(1);
    expect(metrics.projects).toBe(1);
    expect(metrics.activeProjects).toBe(1);
    expect(metrics.totalHours).toBe(3);
    expect(metrics.effectiveHourlyRevenue).toBe(3000);
    expect(metrics.timeByClient).toEqual([
      { clientId: client!._id.toString(), minutes: 180 },
    ]);
    expect(metrics.timeByProject).toEqual([
      { projectId: project!._id.toString(), minutes: 180 },
    ]);
  });

  it("rejects projects and time entries for unknown client relationships", async () => {
    await bootstrapOwner();
    const missingClientId = new mongoose.Types.ObjectId().toString();
    const missingProjectId = new mongoose.Types.ObjectId().toString();

    await expect(
      createProject(context, {
        clientId: missingClientId,
        name: "Broken project",
        type: "software",
        status: "planned",
        estimatedValue: 0,
        actualRevenue: 0,
      }),
    ).resolves.toBeNull();
    await expect(
      createTimeEntry(context, {
        clientId: missingClientId,
        projectId: missingProjectId,
        date: new Date("2026-06-11T00:00:00.000Z"),
        minutes: 30,
        description: "Should not save",
      }),
    ).resolves.toBeNull();
  });

  it("rejects project updates that point at another organisation client", async () => {
    await bootstrapOwner();
    const client = await Client.create({
      organisationId: new mongoose.Types.ObjectId(context.organisationId),
      createdByUserId: new mongoose.Types.ObjectId(context.userId),
      company: "Client Co",
      contacts: [{ email: "client@example.com" }],
    });
    const project = await createProject(context, {
      clientId: client._id.toString(),
      name: "Scoped project",
      type: "software",
      status: "active",
      estimatedValue: 1000,
      actualRevenue: 0,
    });
    const otherClient = await Client.create({
      organisationId: new mongoose.Types.ObjectId(),
      company: "Other Org",
      contacts: [{ email: "other@example.com" }],
    });

    await expect(
      updateProject(context, project!._id.toString(), {
        clientId: otherClient._id.toString(),
      }),
    ).resolves.toBeNull();
  });
});
