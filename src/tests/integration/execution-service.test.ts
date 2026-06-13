import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Client } from "@/models/client";
import { Deliverable } from "@/models/deliverable";
import { ExecutionMilestone } from "@/models/execution-milestone";
import { ExecutionTask } from "@/models/execution-task";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { LifecycleTimelineEvent } from "@/models/lifecycle-timeline-event";
import { Organisation } from "@/models/organisation";
import { Project } from "@/models/project";
import { SetupLock } from "@/models/setup-lock";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import { createClient, createProject } from "@/services/client-service";
import {
  createDeliverable,
  createExecutionMilestone,
  createExecutionTask,
  getExecutionMetrics,
  updateProjectExecution,
} from "@/services/execution-service";

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
    Deliverable.deleteMany({}),
    ExecutionTask.deleteMany({}),
    ExecutionMilestone.deleteMany({}),
    Project.deleteMany({}),
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

describe("execution service", () => {
  it("tracks project progress, milestones, tasks, deliverables, and metrics", async () => {
    await bootstrapOwner();
    const client = await createClient(context, {
      company: "Compiler Labs",
      contacts: [{ email: "client@example.com", name: undefined, role: undefined, phone: undefined }],
      notes: undefined,
      stripeCustomerId: undefined,
    });
    const project = await createProject(context, {
      clientId: client._id.toString(),
      name: "Automation rollout",
      type: "automation",
      status: "active",
      estimatedValue: 10000,
      actualRevenue: 0,
    });
    expect(project).not.toBeNull();

    const updated = await updateProjectExecution(context, project!._id.toString(), {
      health: "at_risk",
      progressPercent: 40,
      clientVisibleSummary: "Discovery and workflow mapping are complete.",
      internalStatusNote: "Waiting on API access.",
    });
    const milestone = await createExecutionMilestone(context, {
      projectId: project!._id.toString(),
      title: "Workflow map approved",
      status: "in_progress",
      dueDate: new Date("2026-06-12T00:00:00.000Z"),
      sortOrder: 1,
    });
    const task = await createExecutionTask(context, {
      projectId: project!._id.toString(),
      milestoneId: milestone!._id.toString(),
      title: "Build integration",
      status: "blocked",
      assigneeName: "Ada",
    });
    const deliverable = await createDeliverable(context, {
      projectId: project!._id.toString(),
      title: "Workflow map",
      url: "https://example.com/map",
      status: "approved",
    });
    const metrics = await getExecutionMetrics(context.organisationId);

    expect(updated?.health).toBe("at_risk");
    expect(task?.status).toBe("blocked");
    expect(deliverable?.status).toBe("approved");
    expect(metrics.blockedTasks).toBe(1);
    expect(metrics.deliverablesReady).toBe(1);
    expect(metrics.overdueMilestones).toBe(1);
  });
});
