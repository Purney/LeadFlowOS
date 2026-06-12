import mongoose from "mongoose";
import { AiDraft } from "@/models/ai-draft";
import { ClientResearch } from "@/models/client-research";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import {
  createLifecycleAccount,
  createLifecycleTimelineEvent,
  updateLifecycleAccount,
} from "@/services/lifecycle-service";
import { generateTextWithOpenAI } from "@/services/openai-service";
import type { ResearchSummaryContent } from "@/types/ai";
import type { LifecycleStatus } from "@/types/lifecycle";
import { buildResearchSummaryPrompt, parseJsonObject } from "@/utils/ai-prompts";
import {
  clientResearchInputSchema,
  clientResearchUpdateSchema,
  researchChecklistUpdateSchema,
  researchSummaryInputSchema,
  type ClientResearchInput,
  type ClientResearchUpdateInput,
  type ResearchChecklistUpdateInput,
  type ResearchSummaryInput,
} from "@/validation/research";

type ActorContext = {
  organisationId: string;
  userId: string;
};

type GenerateOptions = {
  generateText?: (prompt: string) => Promise<string>;
  model?: string;
};

type ChecklistItem = {
  itemId: string;
  label: string;
  completed: boolean;
  completedAt?: Date;
};

function toObjectId(value: string | mongoose.Types.ObjectId) {
  return typeof value === "string" ? new mongoose.Types.ObjectId(value) : value;
}

function cleanString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function dedupe(items: string[] = []) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function lifecycleStatusForResearch(status?: string): LifecycleStatus {
  if (status === "disqualified") return "lost";
  if (status === "qualified") return "active";
  return "active";
}

function serialiseResearch(research: Record<string, unknown>) {
  const id = research._id as mongoose.Types.ObjectId;
  const lifecycleAccountId = research.lifecycleAccountId as
    | mongoose.Types.ObjectId
    | undefined;
  const researchedAt = research.researchedAt as Date | undefined;
  const createdAt = research.createdAt as Date | undefined;
  const updatedAt = research.updatedAt as Date | undefined;

  return {
    id: id.toString(),
    lifecycleAccountId: lifecycleAccountId?.toString(),
    companyName: research.companyName as string,
    website: research.website as string | undefined,
    industry: research.industry as string | undefined,
    companySize: research.companySize as string | undefined,
    region: research.region as string | undefined,
    decisionMakerName: research.decisionMakerName as string | undefined,
    decisionMakerRole: research.decisionMakerRole as string | undefined,
    decisionMakerEmail: research.decisionMakerEmail as string | undefined,
    source: research.source as string | undefined,
    currentProvider: research.currentProvider as string | undefined,
    competitors: (research.competitors ?? []) as string[],
    painHypotheses: (research.painHypotheses ?? []) as string[],
    opportunityIdeas: (research.opportunityIdeas ?? []) as string[],
    positiveSignals: (research.positiveSignals ?? []) as string[],
    negativeSignals: (research.negativeSignals ?? []) as string[],
    checklist: (research.checklist ?? []) as Array<{
      itemId: string;
      label: string;
      completed: boolean;
      completedAt?: Date;
    }>,
    fitScore: research.fitScore as number,
    priority: research.priority as string,
    status: research.status as string,
    notes: research.notes as string | undefined,
    outreachAngle: research.outreachAngle as string | undefined,
    aiSummary: research.aiSummary as ResearchSummaryContent | undefined,
    nextAction: research.nextAction as string | undefined,
    researchedAt: researchedAt?.toISOString(),
    createdAt: createdAt?.toISOString(),
    updatedAt: updatedAt?.toISOString(),
  };
}

function researchLifecyclePayload(data: {
  companyName: string;
  decisionMakerEmail?: string;
  website?: string;
  source?: string;
  notes?: string;
  nextAction?: string;
  fitScore?: number;
  priority?: string;
  status?: string;
}) {
  return {
    name: data.companyName,
    primaryEmail: cleanString(data.decisionMakerEmail) ?? "",
    website: cleanString(data.website) ?? "",
    source: cleanString(data.source) ?? "client research",
    stage: "client_research" as const,
    status: lifecycleStatusForResearch(data.status),
    fitScore: data.fitScore,
    notes: cleanString(data.notes) ?? "",
    nextAction: cleanString(data.nextAction) ?? "",
    tags: ["research", data.priority].filter(Boolean) as string[],
  };
}

export async function listClientResearch(organisationId: string, limit = 80) {
  await connectToDatabase();

  const research = await ClientResearch.find({
    organisationId: toObjectId(organisationId),
  })
    .sort({ fitScore: -1, updatedAt: -1 })
    .limit(limit)
    .lean();

  return research.map(serialiseResearch);
}

export async function createClientResearch(
  context: ActorContext,
  input: ClientResearchInput,
) {
  const data = clientResearchInputSchema.parse(input);
  await connectToDatabase();

  const lifecycleAccount = await createLifecycleAccount(
    context,
    researchLifecyclePayload(data),
  );
  const research = await ClientResearch.create({
    ...data,
    website: cleanString(data.website),
    industry: cleanString(data.industry),
    companySize: cleanString(data.companySize),
    region: cleanString(data.region),
    decisionMakerName: cleanString(data.decisionMakerName),
    decisionMakerRole: cleanString(data.decisionMakerRole),
    decisionMakerEmail: cleanString(data.decisionMakerEmail),
    source: cleanString(data.source),
    currentProvider: cleanString(data.currentProvider),
    competitors: dedupe(data.competitors),
    painHypotheses: dedupe(data.painHypotheses),
    opportunityIdeas: dedupe(data.opportunityIdeas),
    positiveSignals: dedupe(data.positiveSignals),
    negativeSignals: dedupe(data.negativeSignals),
    notes: cleanString(data.notes),
    outreachAngle: cleanString(data.outreachAngle),
    nextAction: cleanString(data.nextAction),
    researchedAt: data.status === "researched" ? new Date() : undefined,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    lifecycleAccountId: lifecycleAccount._id,
  });

  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: lifecycleAccount._id.toString(),
    actorUserId: context.userId,
    stage: "client_research",
    entityType: "client_research",
    entityId: research._id.toString(),
    action: "research.created",
    title: "Client research created",
    metadata: { fitScore: research.fitScore, priority: research.priority },
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "client_research",
    entityId: research._id.toString(),
    action: "research.created",
    metadata: { companyName: research.companyName, fitScore: research.fitScore },
  });

  return research;
}

export async function updateClientResearch(
  context: ActorContext,
  researchId: string,
  input: ClientResearchUpdateInput,
) {
  const data = clientResearchUpdateSchema.parse(input);
  await connectToDatabase();

  const update: Record<string, unknown> = {
    ...data,
    website: cleanString(data.website),
    industry: cleanString(data.industry),
    companySize: cleanString(data.companySize),
    region: cleanString(data.region),
    decisionMakerName: cleanString(data.decisionMakerName),
    decisionMakerRole: cleanString(data.decisionMakerRole),
    decisionMakerEmail: cleanString(data.decisionMakerEmail),
    source: cleanString(data.source),
    currentProvider: cleanString(data.currentProvider),
    notes: cleanString(data.notes),
    outreachAngle: cleanString(data.outreachAngle),
    nextAction: cleanString(data.nextAction),
  };

  for (const key of [
    "competitors",
    "painHypotheses",
    "opportunityIdeas",
    "positiveSignals",
    "negativeSignals",
  ] as const) {
    if (data[key]) update[key] = dedupe(data[key]);
  }

  if (data.status === "researched" || data.status === "qualified") {
    update.researchedAt = new Date();
  }

  Object.keys(update).forEach((key) => {
    if (update[key] === undefined) delete update[key];
  });

  const research = await ClientResearch.findOneAndUpdate(
    {
      _id: toObjectId(researchId),
      organisationId: toObjectId(context.organisationId),
    },
    { $set: update },
    { returnDocument: "after" },
  );

  if (!research) return null;

  if (research.lifecycleAccountId) {
    await updateLifecycleAccount(
      context,
      research.lifecycleAccountId.toString(),
      researchLifecyclePayload(research),
    );
  }

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "client_research",
    entityId: research._id.toString(),
    action: "research.updated",
    metadata: { status: research.status, fitScore: research.fitScore },
  });

  return research;
}

export async function updateResearchChecklistItem(
  context: ActorContext,
  researchId: string,
  input: ResearchChecklistUpdateInput,
) {
  const data = researchChecklistUpdateSchema.parse(input);
  await connectToDatabase();

  const research = await ClientResearch.findOne({
    _id: toObjectId(researchId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!research) return null;

  const checklist = research.checklist as ChecklistItem[];
  const item = checklist.find(
    (checklistItem) => checklistItem.itemId === data.itemId,
  );

  if (!item) return null;

  item.completed = data.completed;
  item.completedAt = data.completed ? new Date() : undefined;
  await research.save();

  if (research.lifecycleAccountId) {
    await createLifecycleTimelineEvent({
      organisationId: context.organisationId,
      accountId: research.lifecycleAccountId.toString(),
      actorUserId: context.userId,
      stage: "client_research",
      entityType: "client_research",
      entityId: research._id.toString(),
      action: "research.checklist_updated",
      title: data.completed ? "Research checklist item completed" : "Research checklist item reopened",
      metadata: { item: item.label },
    });
  }

  return research;
}

export async function getResearchMetrics(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);
  const [total, byStatus, highFit, incompleteChecklist] = await Promise.all([
    ClientResearch.countDocuments({ organisationId: orgId }),
    ClientResearch.aggregate([
      { $match: { organisationId: orgId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ClientResearch.countDocuments({
      organisationId: orgId,
      fitScore: { $gte: 75 },
      status: { $ne: "disqualified" },
    }),
    ClientResearch.countDocuments({
      organisationId: orgId,
      "checklist.completed": false,
    }),
  ]);

  return {
    total,
    highFit,
    incompleteChecklist,
    byStatus: Object.fromEntries(
      byStatus.map((item) => [item._id as string, item.count as number]),
    ),
  };
}

export async function generateResearchSummary(
  context: ActorContext,
  input: ResearchSummaryInput,
  options: GenerateOptions = {},
) {
  const data = researchSummaryInputSchema.parse(input);
  await connectToDatabase();

  const research = await ClientResearch.findOne({
    _id: toObjectId(data.researchId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!research) return null;

  const prompt = buildResearchSummaryPrompt({
    companyName: research.companyName,
    website: research.website,
    industry: research.industry,
    companySize: research.companySize,
    region: research.region,
    decisionMakerName: research.decisionMakerName,
    decisionMakerRole: research.decisionMakerRole,
    currentProvider: research.currentProvider,
    competitors: research.competitors,
    painHypotheses: research.painHypotheses,
    opportunityIdeas: research.opportunityIdeas,
    positiveSignals: research.positiveSignals,
    negativeSignals: research.negativeSignals,
    notes: research.notes,
    outreachAngle: research.outreachAngle,
    fitScore: research.fitScore,
  });
  const text = await (options.generateText ?? generateTextWithOpenAI)(prompt);
  const content = parseJsonObject<ResearchSummaryContent>(text, {
    fitSummary: text,
    likelyPainPoints: research.painHypotheses,
    outreachAngles: research.outreachAngle ? [research.outreachAngle] : [],
    risks: research.negativeSignals,
    recommendedNextSteps: research.nextAction ? [research.nextAction] : [],
  });

  research.aiSummary = content;
  research.status = research.status === "draft" ? "researched" : research.status;
  research.researchedAt = research.researchedAt ?? new Date();
  await research.save();

  const draft = await AiDraft.create({
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    type: "research_summary",
    status: "draft",
    prompt,
    content: { ...content, researchId: research._id.toString() },
    model: options.model,
  });

  if (research.lifecycleAccountId) {
    await createLifecycleTimelineEvent({
      organisationId: context.organisationId,
      accountId: research.lifecycleAccountId.toString(),
      actorUserId: context.userId,
      stage: "client_research",
      entityType: "ai_draft",
      entityId: draft._id.toString(),
      action: "research.summary_generated",
      title: "AI research summary generated",
      metadata: { researchId: research._id.toString() },
    });
  }

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "ai_draft",
    entityId: draft._id.toString(),
    action: "ai.research_summary_generated",
    metadata: { researchId: research._id.toString() },
  });

  return { research, draft };
}
