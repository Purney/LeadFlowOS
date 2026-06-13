import mongoose from "mongoose";
import { Deal } from "@/models/deal";
import { Lead } from "@/models/lead";
import { LifecycleAccount } from "@/models/lifecycle-account";
import { Proposal } from "@/models/proposal";
import { SalesTask } from "@/models/sales-task";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import {
  createLifecycleAccount,
  createLifecycleTimelineEvent,
  updateLifecycleAccount,
} from "@/services/lifecycle-service";
import { dealStatusForStage, dealStages, type DealStage } from "@/types/sales";
import {
  dealInputSchema,
  dealUpdateSchema,
  salesTaskInputSchema,
  salesTaskUpdateSchema,
  type DealInput,
  type DealUpdateInput,
  type SalesTaskInput,
  type SalesTaskUpdateInput,
} from "@/validation/sales";

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

function lifecycleStatusForDeal(stage: DealStage) {
  if (stage === "won") return "won";
  if (stage === "lost") return "lost";
  return "active";
}

async function ensureScopedReferences(
  organisationId: string,
  input: Pick<DealInput, "lifecycleAccountId" | "leadId" | "proposalId">,
) {
  const orgId = toObjectId(organisationId);
  const [account, lead, proposal] = await Promise.all([
    input.lifecycleAccountId
      ? LifecycleAccount.findOne({
          _id: toObjectId(input.lifecycleAccountId),
          organisationId: orgId,
        })
      : null,
    input.leadId
      ? Lead.findOne({ _id: toObjectId(input.leadId), organisationId: orgId })
      : null,
    input.proposalId
      ? Proposal.findOne({
          _id: toObjectId(input.proposalId),
          organisationId: orgId,
        })
      : null,
  ]);

  if (input.lifecycleAccountId && !account) return null;
  if (input.leadId && !lead) return null;
  if (input.proposalId && !proposal) return null;

  return { account, lead, proposal };
}

function serializeDeal(deal: Record<string, unknown>) {
  const id = deal._id as mongoose.Types.ObjectId;
  const lifecycleAccountId = deal.lifecycleAccountId as mongoose.Types.ObjectId;
  const leadId = deal.leadId as mongoose.Types.ObjectId | undefined;
  const proposalId = deal.proposalId as mongoose.Types.ObjectId | undefined;
  const expectedCloseDate = deal.expectedCloseDate as Date | undefined;
  const nextActionDueAt = deal.nextActionDueAt as Date | undefined;
  const createdAt = deal.createdAt as Date | undefined;
  const updatedAt = deal.updatedAt as Date | undefined;

  return {
    id: id.toString(),
    lifecycleAccountId: lifecycleAccountId.toString(),
    leadId: leadId?.toString(),
    proposalId: proposalId?.toString(),
    title: deal.title as string,
    companyName: deal.companyName as string,
    contactName: deal.contactName as string | undefined,
    contactEmail: deal.contactEmail as string | undefined,
    valueCents: deal.valueCents as number,
    probability: deal.probability as number,
    stage: deal.stage as DealStage,
    status: deal.status as string,
    expectedCloseDate: expectedCloseDate?.toISOString(),
    nextAction: deal.nextAction as string | undefined,
    nextActionDueAt: nextActionDueAt?.toISOString(),
    notes: deal.notes as string | undefined,
    wonReason: deal.wonReason as string | undefined,
    lostReason: deal.lostReason as string | undefined,
    createdAt: createdAt?.toISOString(),
    updatedAt: updatedAt?.toISOString(),
  };
}

function serializeTask(task: Record<string, unknown>) {
  const id = task._id as mongoose.Types.ObjectId;
  const dealId = task.dealId as mongoose.Types.ObjectId;
  const dueAt = task.dueAt as Date | undefined;

  return {
    id: id.toString(),
    dealId: dealId.toString(),
    title: task.title as string,
    dueAt: dueAt?.toISOString(),
    status: task.status as string,
  };
}

async function syncDealToLifecycle(context: ActorContext, deal: {
  _id: mongoose.Types.ObjectId;
  lifecycleAccountId: mongoose.Types.ObjectId;
  proposalId?: mongoose.Types.ObjectId;
  title: string;
  companyName: string;
  contactEmail?: string;
  stage: DealStage;
  status: string;
  probability: number;
  valueCents: number;
  nextAction?: string;
  nextActionDueAt?: Date;
}) {
  const lifecycleStage =
    deal.stage === "won" ? "onboarding_payment" : "proposal_sales";
  await updateLifecycleAccount(context, deal.lifecycleAccountId.toString(), {
    name: deal.companyName,
    primaryEmail: deal.contactEmail ?? "",
    stage: lifecycleStage,
    status: lifecycleStatusForDeal(deal.stage),
    proposalId: deal.proposalId?.toString(),
    nextAction: deal.nextAction ?? "",
    nextActionDueAt: deal.nextActionDueAt,
    tags: ["sales", deal.stage],
  });
  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: deal.lifecycleAccountId.toString(),
    actorUserId: context.userId,
    stage: lifecycleStage,
    entityType: "deal",
    entityId: deal._id.toString(),
    action: "deal.synced",
    title: "Deal updated",
    metadata: {
      stage: deal.stage,
      probability: deal.probability,
      valueCents: deal.valueCents,
    },
  });
}

export async function listDeals(organisationId: string) {
  await connectToDatabase();
  const deals = await Deal.find({ organisationId: toObjectId(organisationId) })
    .sort({ updatedAt: -1 })
    .limit(80)
    .lean();

  return deals.map(serializeDeal);
}

export async function createDeal(context: ActorContext, input: DealInput) {
  const data = dealInputSchema.parse(input);
  await connectToDatabase();
  const refs = await ensureScopedReferences(context.organisationId, data);
  if (!refs) return null;

  const account =
    refs.account ??
    (await createLifecycleAccount(context, {
      name: data.companyName,
      primaryEmail: cleanString(data.contactEmail) ?? "",
      source: "sales pipeline",
      stage: "proposal_sales",
      status: lifecycleStatusForDeal(data.stage),
      nextAction: cleanString(data.nextAction) ?? "",
      nextActionDueAt: data.nextActionDueAt,
      tags: ["sales", data.stage],
    }));
  const status = data.stage ? dealStatusForStage(data.stage) : data.status;
  const deal = await Deal.create({
    ...data,
    status,
    contactName: cleanString(data.contactName),
    contactEmail: cleanString(data.contactEmail),
    nextAction: cleanString(data.nextAction),
    notes: cleanString(data.notes),
    wonReason: cleanString(data.wonReason),
    lostReason: cleanString(data.lostReason),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    lifecycleAccountId: account._id,
    leadId: data.leadId ? toObjectId(data.leadId) : undefined,
    proposalId: data.proposalId ? toObjectId(data.proposalId) : undefined,
    wonAt: data.stage === "won" ? new Date() : undefined,
    lostAt: data.stage === "lost" ? new Date() : undefined,
  });

  await syncDealToLifecycle(context, deal);
  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "deal",
    entityId: deal._id.toString(),
    action: "deal.created",
    metadata: { stage: deal.stage, valueCents: deal.valueCents },
  });

  return deal;
}

export async function updateDeal(
  context: ActorContext,
  dealId: string,
  input: DealUpdateInput,
) {
  const data = dealUpdateSchema.parse(input);
  await connectToDatabase();
  const existing = await Deal.findOne({
    _id: toObjectId(dealId),
    organisationId: toObjectId(context.organisationId),
  });
  if (!existing) return null;
  const refs = await ensureScopedReferences(context.organisationId, data);
  if (!refs) return null;

  const stage = data.stage ?? existing.stage;
  const set: Record<string, unknown> = {
    ...data,
    status: data.stage ? dealStatusForStage(stage) : data.status,
    contactName: cleanString(data.contactName),
    contactEmail: cleanString(data.contactEmail),
    nextAction: cleanString(data.nextAction),
    notes: cleanString(data.notes),
    wonReason: cleanString(data.wonReason),
    lostReason: cleanString(data.lostReason),
    lifecycleAccountId: data.lifecycleAccountId
      ? toObjectId(data.lifecycleAccountId)
      : undefined,
    leadId: data.leadId ? toObjectId(data.leadId) : undefined,
    proposalId: data.proposalId ? toObjectId(data.proposalId) : undefined,
  };

  if (stage === "won" && existing.stage !== "won") set.wonAt = new Date();
  if (stage === "lost" && existing.stage !== "lost") set.lostAt = new Date();
  Object.keys(set).forEach((key) => {
    if (set[key] === undefined) delete set[key];
  });

  const deal = await Deal.findOneAndUpdate(
    { _id: existing._id },
    { $set: set },
    { returnDocument: "after" },
  );
  if (!deal) return null;

  await syncDealToLifecycle(context, deal);
  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "deal",
    entityId: deal._id.toString(),
    action: `deal.${deal.stage}`,
    metadata: { stage: deal.stage, status: deal.status },
  });

  return deal;
}

export async function getSalesMetrics(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);
  const [pipeline, byStage, openTasks, overdueTasks] = await Promise.all([
    Deal.aggregate([
      { $match: { organisationId: orgId, status: "active" } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalValueCents: { $sum: "$valueCents" },
          weightedValueCents: {
            $sum: { $multiply: ["$valueCents", { $divide: ["$probability", 100] }] },
          },
        },
      },
    ]),
    Deal.aggregate([
      { $match: { organisationId: orgId } },
      { $group: { _id: "$stage", count: { $sum: 1 }, valueCents: { $sum: "$valueCents" } } },
    ]),
    SalesTask.countDocuments({ organisationId: orgId, status: "open" }),
    SalesTask.countDocuments({
      organisationId: orgId,
      status: "open",
      dueAt: { $lte: new Date() },
    }),
  ]);

  return {
    activeDeals: pipeline[0]?.count ?? 0,
    totalValueCents: pipeline[0]?.totalValueCents ?? 0,
    weightedValueCents: Math.round(pipeline[0]?.weightedValueCents ?? 0),
    openTasks,
    overdueTasks,
    byStage: Object.fromEntries(
      dealStages.map((stage) => [
        stage,
        byStage.find((item) => item._id === stage)?.count ?? 0,
      ]),
    ) as Record<DealStage, number>,
  };
}

export async function listSalesTasks(organisationId: string, limit = 50) {
  await connectToDatabase();
  const tasks = await SalesTask.find({ organisationId: toObjectId(organisationId) })
    .sort({ status: 1, dueAt: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  return tasks.map(serializeTask);
}

export async function createSalesTask(context: ActorContext, input: SalesTaskInput) {
  const data = salesTaskInputSchema.parse(input);
  await connectToDatabase();
  const deal = await Deal.findOne({
    _id: toObjectId(data.dealId),
    organisationId: toObjectId(context.organisationId),
  });
  if (!deal) return null;

  const task = await SalesTask.create({
    ...data,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    dealId: deal._id,
  });
  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: deal.lifecycleAccountId.toString(),
    actorUserId: context.userId,
    stage: "proposal_sales",
    entityType: "sales_task",
    entityId: task._id.toString(),
    action: "sales_task.created",
    title: "Sales follow-up created",
    metadata: { title: task.title },
  });
  return task;
}

export async function updateSalesTask(
  context: ActorContext,
  taskId: string,
  input: SalesTaskUpdateInput,
) {
  const data = salesTaskUpdateSchema.parse(input);
  await connectToDatabase();
  const task = await SalesTask.findOneAndUpdate(
    {
      _id: toObjectId(taskId),
      organisationId: toObjectId(context.organisationId),
    },
    {
      $set: {
        status: data.status,
        completedAt: data.status === "completed" ? new Date() : undefined,
      },
    },
    { returnDocument: "after" },
  );
  return task;
}
