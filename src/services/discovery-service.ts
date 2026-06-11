import mongoose from "mongoose";
import { AiDraft } from "@/models/ai-draft";
import { DiscoveryForm } from "@/models/discovery-form";
import { DiscoveryResponse } from "@/models/discovery-response";
import { Lead } from "@/models/lead";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import { generateTextWithOpenAI } from "@/services/openai-service";
import type { DiscoverySummaryContent } from "@/types/ai";
import type { DiscoveryField } from "@/types/discovery";
import { buildDiscoverySummaryPrompt, parseJsonObject } from "@/utils/ai-prompts";
import {
  normaliseDiscoveryFields,
  validateDiscoveryAnswers,
} from "@/utils/discovery";
import { createSlug } from "@/utils/slug";
import {
  discoveryFormInputSchema,
  discoveryFormUpdateSchema,
  discoveryResponseInputSchema,
  discoverySummaryInputSchema,
  type DiscoveryFormInput,
  type DiscoveryFormUpdateInput,
  type DiscoveryResponseInput,
  type DiscoverySummaryInput,
} from "@/validation/discovery";

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

async function uniquePublicSlug(name: string) {
  const base = createSlug(name);
  let slug = base;
  let suffix = 2;

  while (await DiscoveryForm.exists({ publicSlug: slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function listDiscoveryForms(organisationId: string) {
  await connectToDatabase();

  const forms = await DiscoveryForm.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
  const responseCounts = await DiscoveryResponse.aggregate([
    { $match: { organisationId: toObjectId(organisationId) } },
    { $group: { _id: "$discoveryFormId", count: { $sum: 1 } } },
  ]);
  const counts = new Map(
    responseCounts.map((item) => [String(item._id), item.count as number]),
  );

  return forms.map((form) => ({
    ...form,
    responseCount: counts.get(String(form._id)) ?? 0,
  }));
}

export async function listDiscoveryResponses(organisationId: string, limit = 20) {
  await connectToDatabase();

  return DiscoveryResponse.find({ organisationId: toObjectId(organisationId) })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .lean();
}

export async function getDiscoveryMetrics(organisationId: string) {
  await connectToDatabase();

  const [forms, responses] = await Promise.all([
    DiscoveryForm.countDocuments({ organisationId: toObjectId(organisationId) }),
    DiscoveryResponse.countDocuments({ organisationId: toObjectId(organisationId) }),
  ]);

  return { forms, responses };
}

export async function createDiscoveryForm(
  context: ActorContext,
  input: DiscoveryFormInput,
) {
  const data = discoveryFormInputSchema.parse(input);
  await connectToDatabase();

  const form = await DiscoveryForm.create({
    ...data,
    fields: normaliseDiscoveryFields(data.fields),
    publicSlug: await uniquePublicSlug(data.name),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "discovery_form",
    entityId: form._id.toString(),
    action: "discovery_form.created",
    metadata: { status: form.status, fields: form.fields.length },
  });

  return form;
}

export async function updateDiscoveryForm(
  context: ActorContext,
  formId: string,
  input: DiscoveryFormUpdateInput,
) {
  const data = discoveryFormUpdateSchema.parse(input);
  await connectToDatabase();

  const update = {
    ...data,
    ...(data.fields ? { fields: normaliseDiscoveryFields(data.fields) } : {}),
  };
  const form = await DiscoveryForm.findOneAndUpdate(
    { _id: toObjectId(formId), organisationId: toObjectId(context.organisationId) },
    { $set: update },
    { returnDocument: "after" },
  );

  if (!form) return null;

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "discovery_form",
    entityId: form._id.toString(),
    action: "discovery_form.updated",
    metadata: { status: form.status },
  });

  return form;
}

export async function getPublicDiscoveryForm(publicSlug: string) {
  await connectToDatabase();

  return DiscoveryForm.findOne({
    publicSlug,
    status: "published",
  }).lean();
}

export async function submitDiscoveryResponse(
  publicSlug: string,
  input: DiscoveryResponseInput,
) {
  const data = discoveryResponseInputSchema.parse(input);
  await connectToDatabase();

  const form = await DiscoveryForm.findOne({
    publicSlug,
    status: "published",
  });

  if (!form) return null;

  const errors = validateDiscoveryAnswers(form.fields, data.answers);
  if (errors.length > 0) {
    return { errors };
  }

  const response = await DiscoveryResponse.create({
    organisationId: form.organisationId,
    discoveryFormId: form._id,
    leadId: data.leadId ? toObjectId(data.leadId) : undefined,
    respondentEmail: data.respondentEmail,
    respondentName: data.respondentName,
    answers: data.answers,
    submittedAt: new Date(),
  });

  if (data.leadId) {
    await Lead.updateOne(
      { _id: toObjectId(data.leadId), organisationId: form.organisationId },
      { $set: { status: "qualified" } },
    );
  }

  await createActivity({
    organisationId: form.organisationId.toString(),
    entityType: "discovery_response",
    entityId: response._id.toString(),
    action: "discovery_response.submitted",
    metadata: { formId: form._id.toString(), respondentEmail: data.respondentEmail },
  });

  return { response };
}

export async function generateDiscoverySummary(
  context: ActorContext,
  input: DiscoverySummaryInput,
  options: GenerateOptions = {},
) {
  const data = discoverySummaryInputSchema.parse(input);
  await connectToDatabase();

  const response = await DiscoveryResponse.findOne({
    _id: toObjectId(data.responseId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!response) return null;

  const [form, lead] = await Promise.all([
    DiscoveryForm.findById(response.discoveryFormId).lean(),
    response.leadId ? Lead.findById(response.leadId).lean() : null,
  ]);

  if (!form) return null;

  const fields = form.fields as DiscoveryField[];
  const answers = fields.map((field) => ({
    label: field.label,
    answer: response.answers?.[field.id],
  }));
  const prompt = buildDiscoverySummaryPrompt({
    formName: form.name,
    lead: lead
      ? {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          company: lead.company,
          website: lead.website,
          role: lead.role,
          notes: lead.notes,
          source: lead.source,
        }
      : response.respondentEmail
        ? { email: response.respondentEmail, firstName: response.respondentName }
        : undefined,
    answers,
  });
  const text = await (options.generateText ?? generateTextWithOpenAI)(prompt);
  const content = parseJsonObject<DiscoverySummaryContent>(text, {
    objectives: [],
    painPoints: [],
    risks: [],
    opportunities: [],
    recommendedScope: [text],
  });
  const draft = await AiDraft.create({
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    leadId: response.leadId,
    type: "discovery_summary",
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
    action: "ai.discovery_summary_generated",
    metadata: { responseId: response._id.toString() },
  });

  return draft;
}
