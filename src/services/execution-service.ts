import mongoose from "mongoose";
import { Client } from "@/models/client";
import { Deliverable } from "@/models/deliverable";
import { ExecutionMilestone } from "@/models/execution-milestone";
import { ExecutionTask } from "@/models/execution-task";
import { Project } from "@/models/project";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import { createLifecycleTimelineEvent } from "@/services/lifecycle-service";
import {
  deliverableInputSchema,
  executionTaskInputSchema,
  milestoneInputSchema,
  projectExecutionUpdateSchema,
  type DeliverableInput,
  type ExecutionTaskInput,
  type MilestoneInput,
  type ProjectExecutionUpdateInput,
} from "@/validation/execution";

type ActorContext = {
  organisationId: string;
  userId: string;
};

function toObjectId(value: string | mongoose.Types.ObjectId) {
  return typeof value === "string" ? new mongoose.Types.ObjectId(value) : value;
}

function cleanString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function getScopedProject(context: Pick<ActorContext, "organisationId">, projectId: string) {
  return Project.findOne({
    _id: toObjectId(projectId),
    organisationId: toObjectId(context.organisationId),
  });
}

async function timelineForProject(
  context: ActorContext,
  project: { _id: mongoose.Types.ObjectId; clientId: mongoose.Types.ObjectId; name: string },
  input: { entityType: string; entityId: string; action: string; title: string; metadata?: Record<string, unknown> },
) {
  const client = await Client.findOne({
    _id: project.clientId,
    organisationId: toObjectId(context.organisationId),
  }).lean();
  if (!client) return;

  const { LifecycleAccount } = await import("@/models/lifecycle-account");
  const account = await LifecycleAccount.findOne({
    organisationId: toObjectId(context.organisationId),
    clientId: client._id,
  });
  if (!account) return;

  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: account._id.toString(),
    actorUserId: context.userId,
    stage: "solution_execution",
    ...input,
  });
}

export async function getExecutionWorkspace(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);
  const [projects, milestones, tasks, deliverables, metrics] = await Promise.all([
    Project.find({ organisationId: orgId }).sort({ updatedAt: -1 }).lean(),
    ExecutionMilestone.find({ organisationId: orgId }).sort({ sortOrder: 1, dueDate: 1 }).lean(),
    ExecutionTask.find({ organisationId: orgId }).sort({ dueDate: 1, createdAt: -1 }).lean(),
    Deliverable.find({ organisationId: orgId }).sort({ createdAt: -1 }).lean(),
    getExecutionMetrics(organisationId),
  ]);

  return { projects, milestones, tasks, deliverables, metrics };
}

export async function getExecutionMetrics(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);
  const [projectHealth, openTasks, blockedTasks, deliverablesReady, overdueMilestones] =
    await Promise.all([
      Project.aggregate([
        { $match: { organisationId: orgId } },
        { $group: { _id: "$health", count: { $sum: 1 } } },
      ]),
      ExecutionTask.countDocuments({
        organisationId: orgId,
        status: { $in: ["todo", "in_progress"] },
      }),
      ExecutionTask.countDocuments({ organisationId: orgId, status: "blocked" }),
      Deliverable.countDocuments({
        organisationId: orgId,
        status: { $in: ["approved", "delivered"] },
      }),
      ExecutionMilestone.countDocuments({
        organisationId: orgId,
        status: { $ne: "completed" },
        dueDate: { $lte: new Date() },
      }),
    ]);

  return {
    openTasks,
    blockedTasks,
    deliverablesReady,
    overdueMilestones,
    byHealth: Object.fromEntries(
      projectHealth.map((item) => [item._id as string, item.count as number]),
    ),
  };
}

export async function updateProjectExecution(
  context: ActorContext,
  projectId: string,
  input: ProjectExecutionUpdateInput,
) {
  const data = projectExecutionUpdateSchema.parse(input);
  await connectToDatabase();
  const project = await Project.findOneAndUpdate(
    { _id: toObjectId(projectId), organisationId: toObjectId(context.organisationId) },
    { $set: data },
    { returnDocument: "after" },
  );
  if (!project) return null;

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "project",
    entityId: project._id.toString(),
    action: "project.execution_updated",
    metadata: { health: project.health, progressPercent: project.progressPercent },
  });
  await timelineForProject(context, project, {
    entityType: "project",
    entityId: project._id.toString(),
    action: "execution.project_updated",
    title: "Project progress updated",
    metadata: { health: project.health, progressPercent: project.progressPercent },
  });

  return project;
}

export async function createExecutionMilestone(context: ActorContext, input: MilestoneInput) {
  const data = milestoneInputSchema.parse(input);
  await connectToDatabase();
  const project = await getScopedProject(context, data.projectId);
  if (!project) return null;

  const milestone = await ExecutionMilestone.create({
    ...data,
    description: cleanString(data.description),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    projectId: project._id,
    clientId: project.clientId,
    completedAt: data.status === "completed" ? new Date() : undefined,
  });
  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "execution_milestone",
    entityId: milestone._id.toString(),
    action: "execution_milestone.created",
    metadata: { projectId: project._id.toString(), status: milestone.status },
  });
  return milestone;
}

export async function createExecutionTask(context: ActorContext, input: ExecutionTaskInput) {
  const data = executionTaskInputSchema.parse(input);
  await connectToDatabase();
  const project = await getScopedProject(context, data.projectId);
  if (!project) return null;

  if (data.milestoneId) {
    const milestone = await ExecutionMilestone.exists({
      _id: toObjectId(data.milestoneId),
      projectId: project._id,
      organisationId: toObjectId(context.organisationId),
    });
    if (!milestone) return null;
  }

  const task = await ExecutionTask.create({
    ...data,
    description: cleanString(data.description),
    assigneeName: cleanString(data.assigneeName),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    projectId: project._id,
    clientId: project.clientId,
    milestoneId: data.milestoneId ? toObjectId(data.milestoneId) : undefined,
    completedAt: data.status === "completed" ? new Date() : undefined,
  });
  return task;
}

export async function createDeliverable(context: ActorContext, input: DeliverableInput) {
  const data = deliverableInputSchema.parse(input);
  await connectToDatabase();
  const project = await getScopedProject(context, data.projectId);
  if (!project) return null;

  const deliverable = await Deliverable.create({
    ...data,
    description: cleanString(data.description),
    url: cleanString(data.url),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    projectId: project._id,
    clientId: project.clientId,
    deliveredAt: data.status === "delivered" ? new Date() : undefined,
  });
  await timelineForProject(context, project, {
    entityType: "deliverable",
    entityId: deliverable._id.toString(),
    action: "execution.deliverable_created",
    title: "Deliverable added",
    metadata: { title: deliverable.title, status: deliverable.status },
  });
  return deliverable;
}
