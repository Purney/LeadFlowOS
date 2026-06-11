import mongoose from "mongoose";
import { Client } from "@/models/client";
import { Lead } from "@/models/lead";
import { Project } from "@/models/project";
import { TimeEntry } from "@/models/time-entry";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import {
  clientInputSchema,
  convertLeadSchema,
  projectInputSchema,
  projectUpdateSchema,
  timeEntryInputSchema,
  type ClientInput,
  type ConvertLeadInput,
  type ProjectInput,
  type ProjectUpdateInput,
  type TimeEntryInput,
} from "@/validation/client";

type ActorContext = {
  organisationId: string;
  userId: string;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

export async function listClients(organisationId: string) {
  await connectToDatabase();

  return Client.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createClient(context: ActorContext, input: ClientInput) {
  const data = clientInputSchema.parse(input);
  await connectToDatabase();

  const client = await Client.create({
    ...data,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "client",
    entityId: client._id.toString(),
    action: "client.created",
    metadata: { company: client.company },
  });

  return client;
}

export async function convertLeadToClient(
  context: ActorContext,
  input: ConvertLeadInput,
) {
  const data = convertLeadSchema.parse(input);
  await connectToDatabase();

  const lead = await Lead.findOne({
    _id: toObjectId(data.leadId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!lead) return null;

  const existing = await Client.findOne({
    organisationId: toObjectId(context.organisationId),
    leadId: lead._id,
  });

  if (existing) return existing;

  const client = await Client.create({
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    leadId: lead._id,
    company: lead.company || `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || lead.email,
    contacts: [
      {
        name: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
        email: lead.email,
        role: lead.role,
        phone: lead.phone,
      },
    ],
    notes: data.notes ?? lead.notes,
    stripeCustomerId: data.stripeCustomerId,
  });
  lead.status = "won";
  await lead.save();

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "client",
    entityId: client._id.toString(),
    action: "client.converted_from_lead",
    metadata: { leadId: lead._id.toString(), company: client.company },
  });

  return client;
}

export async function listProjects(organisationId: string) {
  await connectToDatabase();

  return Project.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createProject(context: ActorContext, input: ProjectInput) {
  const data = projectInputSchema.parse(input);
  await connectToDatabase();

  const client = await Client.exists({
    _id: toObjectId(data.clientId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!client) return null;

  const project = await Project.create({
    ...data,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    clientId: toObjectId(data.clientId),
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "project",
    entityId: project._id.toString(),
    action: "project.created",
    metadata: { name: project.name, type: project.type },
  });

  return project;
}

export async function updateProject(
  context: ActorContext,
  projectId: string,
  input: ProjectUpdateInput,
) {
  const data = projectUpdateSchema.parse(input);
  await connectToDatabase();

  const project = await Project.findOneAndUpdate(
    {
      _id: toObjectId(projectId),
      organisationId: toObjectId(context.organisationId),
    },
    {
      $set: {
        ...data,
        ...(data.clientId ? { clientId: toObjectId(data.clientId) } : {}),
      },
    },
    { returnDocument: "after" },
  );

  if (!project) return null;

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "project",
    entityId: project._id.toString(),
    action: "project.updated",
    metadata: { status: project.status },
  });

  return project;
}

export async function listTimeEntries(organisationId: string, limit = 50) {
  await connectToDatabase();

  return TimeEntry.find({ organisationId: toObjectId(organisationId) })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
}

export async function createTimeEntry(
  context: ActorContext,
  input: TimeEntryInput,
) {
  const data = timeEntryInputSchema.parse(input);
  await connectToDatabase();

  const project = await Project.findOne({
    _id: toObjectId(data.projectId),
    clientId: toObjectId(data.clientId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!project) return null;

  const entry = await TimeEntry.create({
    ...data,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    projectId: toObjectId(data.projectId),
    clientId: toObjectId(data.clientId),
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "time_entry",
    entityId: entry._id.toString(),
    action: "time_entry.created",
    metadata: { minutes: entry.minutes, projectId: data.projectId },
  });

  return entry;
}

export async function getClientProjectMetrics(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);

  const [clients, projects, timeEntries] = await Promise.all([
    Client.countDocuments({ organisationId: orgId }),
    Project.find({ organisationId: orgId }).lean(),
    TimeEntry.find({ organisationId: orgId }).lean(),
  ]);
  const totalMinutes = timeEntries.reduce((total, entry) => total + entry.minutes, 0);
  const totalRevenue = projects.reduce(
    (total, project) => total + project.actualRevenue,
    0,
  );
  const byClient = new Map<string, number>();
  const byProject = new Map<string, number>();

  for (const entry of timeEntries) {
    const clientId = String(entry.clientId);
    const projectId = String(entry.projectId);
    byClient.set(clientId, (byClient.get(clientId) ?? 0) + entry.minutes);
    byProject.set(projectId, (byProject.get(projectId) ?? 0) + entry.minutes);
  }

  return {
    clients,
    projects: projects.length,
    activeProjects: projects.filter((project) => project.status === "active").length,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    effectiveHourlyRevenue:
      totalMinutes > 0 ? Math.round(totalRevenue / (totalMinutes / 60)) : 0,
    timeByClient: [...byClient.entries()].map(([clientId, minutes]) => ({
      clientId,
      minutes,
    })),
    timeByProject: [...byProject.entries()].map(([projectId, minutes]) => ({
      projectId,
      minutes,
    })),
  };
}
