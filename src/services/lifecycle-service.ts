import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/models/lead";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { LifecycleTimelineEvent } from "@/models/lifecycle-timeline-event";
import { createActivity } from "@/services/activity-service";
import {
  getNextLifecycleStage,
  lifecycleStages,
  type LifecycleStage,
  type LifecycleStatus,
} from "@/types/lifecycle";
import {
  lifecycleAccountInputSchema,
  lifecycleAccountUpdateSchema,
  lifecycleQuerySchema,
  lifecycleStageUpdateSchema,
  type LifecycleAccountInput,
  type LifecycleAccountUpdateInput,
  type LifecycleQueryInput,
  type LifecycleStageUpdateInput,
} from "@/validation/lifecycle";

type ActorContext = {
  organisationId: string;
  userId: string;
};

type AccountSource = {
  _id: mongoose.Types.ObjectId;
  createdByUserId?: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  website?: string;
  source?: string;
  tags?: string[];
  notes?: string;
  status?: string;
};

type ClientSource = {
  _id: mongoose.Types.ObjectId;
  createdByUserId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  company: string;
  contacts?: Array<{ email?: string; name?: string }>;
  notes?: string;
  stripeCustomerId?: string;
};

type TimelineInput = {
  organisationId: string;
  accountId: string;
  actorUserId?: string;
  stage: LifecycleStage;
  entityType: string;
  entityId?: string;
  action: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
};

function toObjectId(value: string | mongoose.Types.ObjectId) {
  return typeof value === "string" ? new mongoose.Types.ObjectId(value) : value;
}

function cleanString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normaliseTags(tags: string[] = []) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

function accountNameForLead(lead: AccountSource) {
  return (
    cleanString(lead.company) ||
    cleanString([lead.firstName, lead.lastName].filter(Boolean).join(" ")) ||
    cleanString(lead.email) ||
    "Untitled account"
  );
}

function stageForLeadStatus(status?: string): LifecycleStage {
  if (status === "won") return "onboarding_payment";
  if (
    status === "discovery_booked" ||
    status === "qualified" ||
    status === "discovery_sent" ||
    status === "proposal_sent"
  ) {
    return "proposal_sales";
  }
  return "client_research";
}

function serializeAccount(account: Record<string, unknown>) {
  const id = account._id as mongoose.Types.ObjectId;
  const organisationId = account.organisationId as mongoose.Types.ObjectId | undefined;
  const createdByUserId = account.createdByUserId as mongoose.Types.ObjectId | undefined;
  const ownerUserId = account.ownerUserId as mongoose.Types.ObjectId | undefined;
  const leadId = account.leadId as mongoose.Types.ObjectId | undefined;
  const clientId = account.clientId as mongoose.Types.ObjectId | undefined;
  const proposalId = account.proposalId as mongoose.Types.ObjectId | undefined;
  const nextActionDueAt = account.nextActionDueAt as Date | undefined;
  const lastActivityAt = account.lastActivityAt as Date | undefined;
  const createdAt = account.createdAt as Date | undefined;
  const updatedAt = account.updatedAt as Date | undefined;

  return {
    id: id.toString(),
    organisationId: organisationId?.toString(),
    createdByUserId: createdByUserId?.toString(),
    ownerUserId: ownerUserId?.toString(),
    leadId: leadId?.toString(),
    clientId: clientId?.toString(),
    proposalId: proposalId?.toString(),
    name: account.name as string,
    primaryEmail: account.primaryEmail as string | undefined,
    website: account.website as string | undefined,
    source: account.source as string | undefined,
    stage: account.stage as LifecycleStage,
    status: account.status as LifecycleStatus,
    fitScore: account.fitScore as number | undefined,
    notes: account.notes as string | undefined,
    nextAction: account.nextAction as string | undefined,
    nextActionDueAt: nextActionDueAt?.toISOString(),
    tags: (account.tags ?? []) as string[],
    stripeCustomerId: account.stripeCustomerId as string | undefined,
    lastActivityAt: lastActivityAt?.toISOString(),
    createdAt: createdAt?.toISOString(),
    updatedAt: updatedAt?.toISOString(),
  };
}

function serializeEvent(event: Record<string, unknown>) {
  const id = event._id as mongoose.Types.ObjectId;
  const accountId = event.accountId as mongoose.Types.ObjectId | undefined;
  const actorUserId = event.actorUserId as mongoose.Types.ObjectId | undefined;
  const occurredAt = event.occurredAt as Date | undefined;

  return {
    id: id.toString(),
    accountId: accountId?.toString(),
    actorUserId: actorUserId?.toString(),
    stage: event.stage as LifecycleStage,
    entityType: event.entityType as string,
    entityId: event.entityId as string | undefined,
    action: event.action as string,
    title: event.title as string,
    body: event.body as string | undefined,
    metadata: event.metadata as Record<string, unknown>,
    occurredAt: occurredAt?.toISOString(),
  };
}

export async function createLifecycleAccount(
  context: ActorContext,
  input: LifecycleAccountInput,
) {
  const data = lifecycleAccountInputSchema.parse(input);
  await connectToDatabase();

  const account = await LifecycleAccount.create({
    ...data,
    primaryEmail: cleanString(data.primaryEmail),
    website: cleanString(data.website),
    source: cleanString(data.source),
    notes: cleanString(data.notes),
    nextAction: cleanString(data.nextAction),
    tags: normaliseTags(data.tags),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    ownerUserId: toObjectId(context.userId),
    lastActivityAt: new Date(),
  });

  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: account._id.toString(),
    actorUserId: context.userId,
    stage: account.stage,
    entityType: "lifecycle_account",
    entityId: account._id.toString(),
    action: "lifecycle.account_created",
    title: "Account created",
    metadata: { stage: account.stage, source: account.source },
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "lifecycle_account",
    entityId: account._id.toString(),
    action: "lifecycle_account.created",
    metadata: { name: account.name, stage: account.stage },
  });

  return account;
}

export async function listLifecycleAccounts(
  organisationId: string,
  filters: LifecycleQueryInput = { stage: "all", status: "all" },
) {
  const data = lifecycleQuerySchema.parse(filters);
  await connectToDatabase();

  const query: Record<string, unknown> = {
    organisationId: toObjectId(organisationId),
  };

  if (data.stage !== "all") query.stage = data.stage;
  if (data.status !== "all") query.status = data.status;
  if (data.search) {
    const search = data.search.trim();
    query.$or = [
      { name: new RegExp(search, "i") },
      { primaryEmail: new RegExp(search, "i") },
      { website: new RegExp(search, "i") },
      { source: new RegExp(search, "i") },
    ];
  }

  const accounts = await LifecycleAccount.find(query)
    .sort({ lastActivityAt: -1, updatedAt: -1 })
    .limit(80)
    .lean();

  return accounts.map(serializeAccount);
}

export async function getLifecycleMetrics(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);

  const [total, byStage, byStatus, dueNextActions] = await Promise.all([
    LifecycleAccount.countDocuments({ organisationId: orgId }),
    LifecycleAccount.aggregate([
      { $match: { organisationId: orgId } },
      { $group: { _id: "$stage", count: { $sum: 1 } } },
    ]),
    LifecycleAccount.aggregate([
      { $match: { organisationId: orgId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    LifecycleAccount.countDocuments({
      organisationId: orgId,
      status: { $in: ["active", "at_risk", "blocked"] },
      nextActionDueAt: { $lte: new Date() },
    }),
  ]);

  const stageCounts = Object.fromEntries(
    lifecycleStages.map((stage) => [stage, 0]),
  ) as Record<LifecycleStage, number>;

  for (const item of byStage) {
    if (item._id in stageCounts) {
      stageCounts[item._id as LifecycleStage] = item.count as number;
    }
  }

  return {
    total,
    byStage: stageCounts,
    byStatus: Object.fromEntries(
      byStatus.map((item) => [item._id as string, item.count as number]),
    ) as Partial<Record<LifecycleStatus, number>>,
    dueNextActions,
  };
}

export async function getLifecycleCommandCenter(organisationId: string) {
  const [accounts, metrics, recentEvents] = await Promise.all([
    listLifecycleAccounts(organisationId),
    getLifecycleMetrics(organisationId),
    listRecentLifecycleTimeline(organisationId, 10),
  ]);

  return { accounts, metrics, recentEvents };
}

export async function updateLifecycleAccount(
  context: ActorContext,
  accountId: string,
  input: LifecycleAccountUpdateInput,
) {
  const data = lifecycleAccountUpdateSchema.parse(input);
  await connectToDatabase();

  const update: Record<string, unknown> = {
    ...data,
    primaryEmail: cleanString(data.primaryEmail),
    website: cleanString(data.website),
    source: cleanString(data.source),
    notes: cleanString(data.notes),
    nextAction: cleanString(data.nextAction),
    stripeCustomerId: cleanString(data.stripeCustomerId),
    tags: data.tags ? normaliseTags(data.tags) : undefined,
    lastActivityAt: new Date(),
  };

  for (const key of ["leadId", "clientId", "proposalId"] as const) {
    if (data[key]) update[key] = toObjectId(data[key]);
  }

  Object.keys(update).forEach((key) => {
    if (update[key] === undefined) delete update[key];
  });

  return LifecycleAccount.findOneAndUpdate(
    {
      _id: toObjectId(accountId),
      organisationId: toObjectId(context.organisationId),
    },
    { $set: update },
    { returnDocument: "after" },
  );
}

export async function moveLifecycleAccountStage(
  context: ActorContext,
  accountId: string,
  input: LifecycleStageUpdateInput,
) {
  const data = lifecycleStageUpdateSchema.parse(input);
  await connectToDatabase();

  const account = await LifecycleAccount.findOneAndUpdate(
    {
      _id: toObjectId(accountId),
      organisationId: toObjectId(context.organisationId),
    },
    {
      $set: {
        stage: data.stage,
        status: data.status ?? "active",
        nextAction: cleanString(data.nextAction),
        nextActionDueAt: data.nextActionDueAt,
        lastActivityAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!account) return null;

  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: account._id.toString(),
    actorUserId: context.userId,
    stage: account.stage,
    entityType: "lifecycle_account",
    entityId: account._id.toString(),
    action: "lifecycle.stage_changed",
    title: "Stage changed",
    body: cleanString(data.note),
    metadata: {
      stage: account.stage,
      status: account.status,
      nextStage: getNextLifecycleStage(account.stage),
    },
  });

  return account;
}

export async function ensureLifecycleAccountForLead(
  context: ActorContext,
  lead: AccountSource,
) {
  await connectToDatabase();
  const stage = stageForLeadStatus(lead.status);
  const name = accountNameForLead(lead);

  const account = await LifecycleAccount.findOneAndUpdate(
    {
      organisationId: toObjectId(context.organisationId),
      leadId: lead._id,
    },
    {
      $set: {
        name,
        primaryEmail: cleanString(lead.email),
        website: cleanString(lead.website),
        source: cleanString(lead.source),
        notes: cleanString(lead.notes),
        tags: normaliseTags(lead.tags),
        stage,
        lastActivityAt: new Date(),
      },
      $setOnInsert: {
        organisationId: toObjectId(context.organisationId),
        createdByUserId: toObjectId(context.userId),
        ownerUserId: toObjectId(context.userId),
        leadId: lead._id,
        status: "active",
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: account._id.toString(),
    actorUserId: context.userId,
    stage: account.stage,
    entityType: "lead",
    entityId: lead._id.toString(),
    action: "lifecycle.lead_synced",
    title: "Lead synced to lifecycle",
    metadata: { leadStatus: lead.status },
  });

  return account;
}

export async function ensureLifecycleAccountForClient(
  context: ActorContext,
  client: ClientSource,
) {
  await connectToDatabase();
  const primaryContact = client.contacts?.find((contact) => contact.email);
  const leadAccount = client.leadId
    ? await LifecycleAccount.findOne({
        organisationId: toObjectId(context.organisationId),
        leadId: client.leadId,
      })
    : null;

  const account = await LifecycleAccount.findOneAndUpdate(
    {
      organisationId: toObjectId(context.organisationId),
      ...(leadAccount ? { _id: leadAccount._id } : { clientId: client._id }),
    },
    {
      $set: {
        name: client.company,
        primaryEmail: cleanString(primaryContact?.email),
        notes: cleanString(client.notes),
        clientId: client._id,
        leadId: client.leadId,
        stripeCustomerId: cleanString(client.stripeCustomerId),
        stage: "onboarding_payment",
        status: "won",
        lastActivityAt: new Date(),
      },
      $setOnInsert: {
        organisationId: toObjectId(context.organisationId),
        createdByUserId: toObjectId(context.userId),
        ownerUserId: toObjectId(context.userId),
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: account._id.toString(),
    actorUserId: context.userId,
    stage: account.stage,
    entityType: "client",
    entityId: client._id.toString(),
    action: "lifecycle.client_synced",
    title: "Client linked to lifecycle",
    metadata: { leadId: client.leadId?.toString() },
  });

  return account;
}

export async function advanceLifecycleAccountForProject(
  context: ActorContext,
  input: { clientId: string; projectId: string; projectName: string },
) {
  await connectToDatabase();

  const account = await LifecycleAccount.findOneAndUpdate(
    {
      organisationId: toObjectId(context.organisationId),
      clientId: toObjectId(input.clientId),
    },
    {
      $set: {
        stage: "solution_execution",
        status: "active",
        lastActivityAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!account) return null;

  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: account._id.toString(),
    actorUserId: context.userId,
    stage: "solution_execution",
    entityType: "project",
    entityId: input.projectId,
    action: "lifecycle.project_started",
    title: "Project started",
    metadata: { projectName: input.projectName },
  });

  return account;
}

export async function syncExistingLeadsToLifecycle(context: ActorContext) {
  await connectToDatabase();
  const leads = await Lead.find({
    organisationId: toObjectId(context.organisationId),
  });

  await Promise.all(
    leads.map((lead) => ensureLifecycleAccountForLead(context, lead)),
  );

  return leads.length;
}

export async function createLifecycleTimelineEvent(input: TimelineInput) {
  await connectToDatabase();

  const event = await LifecycleTimelineEvent.create({
    ...input,
    organisationId: toObjectId(input.organisationId),
    accountId: toObjectId(input.accountId),
    actorUserId: input.actorUserId ? toObjectId(input.actorUserId) : undefined,
    occurredAt: input.occurredAt ?? new Date(),
  });

  await LifecycleAccount.updateOne(
    {
      _id: toObjectId(input.accountId),
      organisationId: toObjectId(input.organisationId),
    },
    { $set: { lastActivityAt: input.occurredAt ?? new Date() } },
  );

  return event;
}

export async function listRecentLifecycleTimeline(
  organisationId: string,
  limit = 20,
) {
  await connectToDatabase();
  const events = await LifecycleTimelineEvent.find({
    organisationId: toObjectId(organisationId),
  })
    .sort({ occurredAt: -1 })
    .limit(limit)
    .lean();

  return events.map(serializeEvent);
}
