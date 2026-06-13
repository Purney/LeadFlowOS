import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Client } from "@/models/client";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { LifecycleTimelineEvent } from "@/models/lifecycle-timeline-event";
import { MaintenancePlan } from "@/models/maintenance-plan";
import { MaintenanceTask } from "@/models/maintenance-task";
import { Organisation } from "@/models/organisation";
import { SetupLock } from "@/models/setup-lock";
import { SupportTicket } from "@/models/support-ticket";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import { createClient } from "@/services/client-service";
import {
  createMaintenancePlan,
  createMaintenanceTask,
  createSupportTicket,
  getMaintenanceMetrics,
} from "@/services/maintenance-service";

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
    MaintenanceTask.deleteMany({}),
    SupportTicket.deleteMany({}),
    MaintenancePlan.deleteMany({}),
    Client.deleteMany({}),
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

describe("maintenance service", () => {
  it("creates plans, tickets, tasks, metrics, and lifecycle maintenance stage", async () => {
    await bootstrapOwner();
    const client = await createClient(context, {
      company: "Compiler Labs",
      contacts: [{ email: "client@example.com", name: undefined, role: undefined, phone: undefined }],
      notes: undefined,
      stripeCustomerId: undefined,
    });

    const plan = await createMaintenancePlan(context, {
      clientId: client._id.toString(),
      name: "Monthly care",
      monthlyFeeCents: 300000,
      includedHours: 6,
      health: "at_risk",
      renewalDate: new Date("2026-06-20T00:00:00.000Z"),
      nextCheckInDate: new Date("2026-06-15T00:00:00.000Z"),
    });
    const ticket = await createSupportTicket(context, {
      clientId: client._id.toString(),
      title: "Production issue",
      priority: "urgent",
      status: "open",
    });
    const task = await createMaintenanceTask(context, {
      planId: plan!._id.toString(),
      title: "Monthly health check",
      dueDate: new Date("2026-06-01T00:00:00.000Z"),
    });
    const metrics = await getMaintenanceMetrics(context.organisationId);
    const account = await LifecycleAccount.findOne({ clientId: client._id }).lean();

    expect(plan?.monthlyFeeCents).toBe(300000);
    expect(ticket?.priority).toBe("urgent");
    expect(task?.status).toBe("scheduled");
    expect(metrics.activePlans).toBe(1);
    expect(metrics.monthlyRecurringCents).toBe(300000);
    expect(metrics.urgentTickets).toBe(1);
    expect(metrics.dueTasks).toBe(1);
    expect(account?.stage).toBe("maintenance");
  });
});
