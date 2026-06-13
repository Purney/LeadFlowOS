import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createFirstOwner } from "@/services/auth-service";
import { createClient } from "@/services/client-service";
import { getCommandCenter } from "@/services/command-service";
import {
  createMaintenancePlan,
  createSupportTicket,
} from "@/services/maintenance-service";
import { ActivityLog } from "@/models/activity-log";
import { Client } from "@/models/client";
import { MaintenancePlan } from "@/models/maintenance-plan";
import { MaintenanceTask } from "@/models/maintenance-task";
import { SupportTicket } from "@/models/support-ticket";
import { Organisation } from "@/models/organisation";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { connectToDatabase } from "@/lib/db";

describe("command service", () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    await connectToDatabase();
  });

  beforeEach(async () => {
    await Promise.all([
      ActivityLog.deleteMany({}),
      Client.deleteMany({}),
      MaintenancePlan.deleteMany({}),
      MaintenanceTask.deleteMany({}),
      Organisation.deleteMany({}),
      SetupLock.deleteMany({}),
      SupportTicket.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("surfaces urgent maintenance work as a critical command action", async () => {
    const owner = await createFirstOwner({
      ownerName: "Ada Lovelace",
      email: "ada@example.com",
      password: "CorrectHorseBatteryStaple1!",
      organisationName: "Compiler Labs",
    });

    const context = {
      organisationId: owner.user.organisationId.toString(),
      userId: owner.user._id.toString(),
    };

    const client = await createClient(context, {
      company: "Compiler Labs Client",
      contacts: [{ name: "Grace Hopper", email: "grace@example.com" }],
    });

    await createMaintenancePlan(context, {
      clientId: client._id.toString(),
      name: "Monthly care",
      monthlyFeeCents: 150000,
      includedHours: 5,
      health: "at_risk",
    });

    await createSupportTicket(context, {
      clientId: client._id.toString(),
      title: "Production incident",
      priority: "urgent",
      status: "open",
    });

    const command = await getCommandCenter(context.organisationId);

    expect(command.metrics.maintenancePlans).toBe(1);
    expect(command.actions.map((action) => action.id)).toContain(
      "maintenance-risk",
    );
    expect(command.criticalCount).toBeGreaterThan(0);
  });
});
