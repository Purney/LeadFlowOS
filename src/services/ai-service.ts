import mongoose from "mongoose";
import { AiDraft } from "@/models/ai-draft";
import { EmailMessage } from "@/models/email-message";
import { Lead } from "@/models/lead";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import { generateTextWithOpenAI } from "@/services/openai-service";
import type { ColdEmailDraftContent, ReplyDraftContent } from "@/types/ai";
import {
  buildColdEmailPrompt,
  buildReplyDraftPrompt,
  parseJsonObject,
} from "@/utils/ai-prompts";
import {
  coldEmailGenerationSchema,
  replyDraftGenerationSchema,
  type ColdEmailGenerationInput,
  type ReplyDraftGenerationInput,
} from "@/validation/ai";

type ActorContext = {
  organisationId: string;
  userId: string;
};

type GenerateOptions = {
  generateText?: (prompt: string) => Promise<string>;
  model?: string;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function leadPromptData(lead: {
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  website?: string;
  role?: string;
  notes?: string;
  source?: string;
  customFields?: Record<string, unknown>;
}) {
  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    company: lead.company,
    website: lead.website,
    role: lead.role,
    notes: lead.notes,
    source: lead.source,
    customFields: lead.customFields,
  };
}

export async function listAiDrafts(organisationId: string, limit = 12) {
  await connectToDatabase();

  return AiDraft.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function generateColdEmailDraft(
  context: ActorContext,
  input: ColdEmailGenerationInput,
  options: GenerateOptions = {},
) {
  const data = coldEmailGenerationSchema.parse(input);
  await connectToDatabase();

  const lead = await Lead.findOne({
    _id: toObjectId(data.leadId),
    organisationId: toObjectId(context.organisationId),
  }).lean();

  if (!lead) return null;

  const prompt = buildColdEmailPrompt({
    lead: leadPromptData(lead),
    serviceOffer: data.serviceOffer,
    campaignGoal: data.campaignGoal,
  });
  const text = await (options.generateText ?? generateTextWithOpenAI)(prompt);
  const content = parseJsonObject<ColdEmailDraftContent>(text, {
    subjects: ["AI-generated subject unavailable"],
    body: text,
    followUps: [],
  });
  const draft = await AiDraft.create({
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    leadId: lead._id,
    type: "cold_email",
    status: "draft",
    prompt,
    content,
    model: options.model,
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "ai_draft",
    entityId: draft._id.toString(),
    action: "ai.cold_email_generated",
    metadata: { leadId: lead._id.toString() },
  });

  return draft;
}

export async function generateReplyDraft(
  context: ActorContext,
  input: ReplyDraftGenerationInput,
  options: GenerateOptions = {},
) {
  const data = replyDraftGenerationSchema.parse(input);
  await connectToDatabase();

  const lead = await Lead.findOne({
    _id: toObjectId(data.leadId),
    organisationId: toObjectId(context.organisationId),
  }).lean();

  if (!lead) return null;

  const messages = await EmailMessage.find({
    organisationId: toObjectId(context.organisationId),
    leadId: lead._id,
  })
    .sort({ createdAt: 1 })
    .limit(20)
    .lean();
  const prompt = buildReplyDraftPrompt({
    lead: leadPromptData(lead),
    messages: messages.map((message) => ({
      direction: message.direction as "inbound" | "outbound",
      subject: message.subject,
      body: message.body,
      createdAt: message.createdAt,
    })),
  });
  const text = await (options.generateText ?? generateTextWithOpenAI)(prompt);
  const content = parseJsonObject<ReplyDraftContent>(text, {
    summary: "Summary unavailable.",
    suggestedResponse: text,
  });
  const latestInbound = [...messages]
    .reverse()
    .find((message) => message.direction === "inbound");
  const draft = await AiDraft.create({
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    leadId: lead._id,
    emailMessageId: latestInbound?._id,
    type: "reply",
    status: "draft",
    prompt,
    content,
    model: options.model,
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "ai_draft",
    entityId: draft._id.toString(),
    action: "ai.reply_generated",
    metadata: { leadId: lead._id.toString() },
  });

  return draft;
}
