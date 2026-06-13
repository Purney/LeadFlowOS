import mongoose from "mongoose";
import { Client } from "@/models/client";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { MaintenancePlan } from "@/models/maintenance-plan";
import { MaintenanceTask } from "@/models/maintenance-task";
import { Project } from "@/models/project";
import { SupportTicket } from "@/models/support-ticket";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import {
  createLifecycleTimelineEvent,
  updateLifecycleAccount,
} from "@/services/lifecycle-service";
import {
  maintenancePlanInputSchema,
  maintenanceTaskInputSchema,
  supportTicketInputSchema,
  type MaintenancePlanInput,
  type MaintenanceTaskInput,
  type SupportTicketInput,
} from "@/validation/maintenance";

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

async function findScopedClient(organisationId: string, clientId: string) {
  return Client.findOne({
    _id: toObjectId(clientId),
    organisationId: toObjectId(organisationId),
  });
}

async function validateProject(organisationId: string, clientId: string, projectId?: string) {
  if (!projectId) return true;
  return Boolean(
    await Project.exists({
      _id: toObjectId(projectId),
      clientId: toObjectId(clientId),
      organisationId: toObjectId(organisationId),
    }),
  );
}

async function maintenanceLifecycle(
  context: ActorContext,
  clientId: mongoose.Types.ObjectId,
  input: { title: string; entityType: string; entityId: string; metadata?: Record<string, unknown> },
) {
  const account = await LifecycleAccount.findOne({
    organisationId: toObjectId(context.organisationId),
    clientId,
  });
  if (!account) return;

  await updateLifecycleAccount(context, account._id.toString(), {
    stage: "maintenance",
    status: "active",
    tags: ["maintenance"],
    nextAction: input.title,
  });
  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: account._id.toString(),
    actorUserId: context.userId,
    stage: "maintenance",
    entityType: input.entityType,
    entityId: input.entityId,
    action: `${input.entityType}.created`,
    title: input.title,
    metadata: input.metadata,
  });
}

export async function listMaintenance(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);
  const [plans, tickets, tasks, metrics] = await Promise.all([
    MaintenancePlan.find({ organisationId: orgId }).sort({ updatedAt: -1 }).lean(),
    SupportTicket.find({ organisationId: orgId }).sort({ updatedAt: -1 }).lean(),
    MaintenanceTask.find({ organisationId: orgId }).sort({ dueDate: 1, createdAt: -1 }).lean(),
    getMaintenanceMetrics(organisationId),
  ]);

  return { plans, tickets, tasks, metrics };
}

export async function createMaintenancePlan(context: ActorContext, input: MaintenancePlanInput) {
  const data = maintenancePlanInputSchema.parse(input);
  await connectToDatabase();
  const client = await findScopedClient(context.organisationId, data.clientId);
  if (!client) return null;
  if (!(await validateProject(context.organisationId, data.clientId, data.projectId))) return null;

  const plan = await MaintenancePlan.create({
    ...data,
    notes: cleanString(data.notes),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    clientId: client._id,
    projectId: data.projectId ? toObjectId(data.projectId) : undefined,
  });
  await maintenanceLifecycle(context, client._id, {
    title: "Maintenance plan created",
    entityType: "maintenance_plan",
    entityId: plan._id.toString(),
    metadata: { monthlyFeeCents: plan.monthlyFeeCents, cadence: plan.cadence },
  });
  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "maintenance_plan",
    entityId: plan._id.toString(),
    action: "maintenance_plan.created",
    metadata: { clientId: client._id.toString(), status: plan.status },
  });
  return plan;
}

export async function createSupportTicket(context: ActorContext, input: SupportTicketInput) {
  const data = supportTicketInputSchema.parse(input);
  await connectToDatabase();
  const client = await findScopedClient(context.organisationId, data.clientId);
  if (!client) return null;
  if (!(await validateProject(context.organisationId, data.clientId, data.projectId))) return null;

  const ticket = await SupportTicket.create({
    ...data,
    description: cleanString(data.description),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    clientId: client._id,
    projectId: data.projectId ? toObjectId(data.projectId) : undefined,
    resolvedAt: ["resolved", "closed"].includes(data.status) ? new Date() : undefined,
  });
  await maintenanceLifecycle(context, client._id, {
    title: "Support ticket opened",
    entityType: "support_ticket",
    entityId: ticket._id.toString(),
    metadata: { priority: ticket.priority, status: ticket.status },
  });
  return ticket;
}

export async function createMaintenanceTask(context: ActorContext, input: MaintenanceTaskInput) {
  const data = maintenanceTaskInputSchema.parse(input);
  await connectToDatabase();
  const plan = await MaintenancePlan.findOne({
    _id: toObjectId(data.planId),
    organisationId: toObjectId(context.organisationId),
  });
  if (!plan) return null;

  const task = await MaintenanceTask.create({
    ...data,
    description: cleanString(data.description),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    planId: plan._id,
    clientId: plan.clientId,
    completedAt: data.status === "completed" ? new Date() : undefined,
  });
  await maintenanceLifecycle(context, plan.clientId, {
    title: "Maintenance task scheduled",
    entityType: "maintenance_task",
    entityId: task._id.toString(),
    metadata: { status: task.status, dueDate: task.dueDate },
  });
  return task;
}

export async function getMaintenanceMetrics(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);
  const now = new Date();
  const renewalWindow = new Date(now);
  renewalWindow.setDate(renewalWindow.getDate() + 45);

  const [activePlans, monthly, openTickets, urgentTickets, dueTasks, renewals, atRisk] =
    await Promise.all([
      MaintenancePlan.countDocuments({ organisationId: orgId, status: "active" }),
      MaintenancePlan.aggregate([
        { $match: { organisationId: orgId, status: "active" } },
        { $group: { _id: null, amount: { $sum: "$monthlyFeeCents" } } },
      ]),
      SupportTicket.countDocuments({
        organisationId: orgId,
        status: { $in: ["open", "in_progress", "waiting_on_client"] },
      }),
      SupportTicket.countDocuments({
        organisationId: orgId,
        priority: "urgent",
        status: { $nin: ["resolved", "closed"] },
      }),
      MaintenanceTask.countDocuments({
        organisationId: orgId,
        status: { $in: ["scheduled", "in_progress"] },
        dueDate: { $lte: now },
      }),
      MaintenancePlan.countDocuments({
        organisationId: orgId,
        status: "active",
        renewalDate: { $lte: renewalWindow },
      }),
      MaintenancePlan.countDocuments({
        organisationId: orgId,
        health: "at_risk",
        status: "active",
      }),
    ]);

  return {
    activePlans,
    monthlyRecurringCents: monthly[0]?.amount ?? 0,
    openTickets,
    urgentTickets,
    dueTasks,
    renewals,
    atRisk,
  };
}
