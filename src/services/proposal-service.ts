import mongoose from "mongoose";
import { DiscoveryForm } from "@/models/discovery-form";
import { DiscoveryResponse } from "@/models/discovery-response";
import { Lead } from "@/models/lead";
import { Proposal } from "@/models/proposal";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import { generateTextWithOpenAI } from "@/services/openai-service";
import type { DiscoveryField } from "@/types/discovery";
import type { ProposalContent } from "@/types/proposal";
import { buildProposalDraftPrompt, parseJsonObject } from "@/utils/ai-prompts";
import {
  proposalAiDraftSchema,
  proposalInputSchema,
  proposalUpdateSchema,
  type ProposalAiDraftInput,
  type ProposalInput,
  type ProposalUpdateInput,
} from "@/validation/proposal";

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

function versionEntry(content: ProposalContent, userId: string, version: number) {
  return {
    version,
    content,
    createdByUserId: toObjectId(userId),
    createdAt: new Date(),
  };
}

export async function listProposals(organisationId: string) {
  await connectToDatabase();

  return Proposal.find({ organisationId: toObjectId(organisationId) })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getProposalMetrics(organisationId: string) {
  await connectToDatabase();

  const [total, byStatus] = await Promise.all([
    Proposal.countDocuments({ organisationId: toObjectId(organisationId) }),
    Proposal.aggregate([
      { $match: { organisationId: toObjectId(organisationId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    total,
    byStatus: Object.fromEntries(
      byStatus.map((item) => [item._id as string, item.count as number]),
    ),
  };
}

export async function createProposal(context: ActorContext, input: ProposalInput) {
  const data = proposalInputSchema.parse(input);
  await connectToDatabase();

  const proposal = await Proposal.create({
    ...data,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    leadId: data.leadId ? toObjectId(data.leadId) : undefined,
    discoveryResponseId: data.discoveryResponseId
      ? toObjectId(data.discoveryResponseId)
      : undefined,
    currentVersion: 1,
    versions: [versionEntry(data.content, context.userId, 1)],
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "proposal",
    entityId: proposal._id.toString(),
    action: "proposal.created",
    metadata: { status: proposal.status },
  });

  return proposal;
}

export async function updateProposal(
  context: ActorContext,
  proposalId: string,
  input: ProposalUpdateInput,
) {
  const data = proposalUpdateSchema.parse(input);
  await connectToDatabase();

  const existing = await Proposal.findOne({
    _id: toObjectId(proposalId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!existing) return null;

  const set: Record<string, unknown> = {
    ...data,
    ...(data.leadId ? { leadId: toObjectId(data.leadId) } : {}),
    ...(data.discoveryResponseId
      ? { discoveryResponseId: toObjectId(data.discoveryResponseId) }
      : {}),
  };
  const push: Record<string, unknown> = {};

  if (data.content) {
    const nextVersion = existing.currentVersion + 1;
    set.currentVersion = nextVersion;
    push.versions = versionEntry(data.content, context.userId, nextVersion);
  }

  if (data.status === "sent" && existing.status !== "sent") {
    set.sentAt = new Date();
  }
  if (data.status === "accepted" && existing.status !== "accepted") {
    set.acceptedAt = new Date();
  }
  if (data.status === "rejected" && existing.status !== "rejected") {
    set.rejectedAt = new Date();
  }

  const proposal = await Proposal.findOneAndUpdate(
    { _id: existing._id },
    {
      $set: set,
      ...(Object.keys(push).length ? { $push: push } : {}),
    },
    { returnDocument: "after" },
  );

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "proposal",
    entityId: existing._id.toString(),
    action: `proposal.${data.status ?? "updated"}`,
  });

  return proposal;
}

export async function generateProposalFromDiscovery(
  context: ActorContext,
  input: ProposalAiDraftInput,
  options: GenerateOptions = {},
) {
  const data = proposalAiDraftSchema.parse(input);
  await connectToDatabase();

  const response = await DiscoveryResponse.findOne({
    _id: toObjectId(data.discoveryResponseId),
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
  const title =
    data.title ??
    `${lead?.company ?? response.respondentName ?? "Client"} proposal`;
  const prompt = buildProposalDraftPrompt({
    title,
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
  const content = parseJsonObject<ProposalContent>(text, {
    executiveSummary: text,
    identifiedProblem: "To be refined.",
    proposedSolution: "To be refined.",
    deliverables: [],
    assumptions: [],
    estimatedTimeline: "To be estimated.",
    optionalEnhancements: [],
  });

  return createProposal(context, {
    title,
    leadId: response.leadId?.toString(),
    discoveryResponseId: response._id.toString(),
    status: "draft",
    content,
  });
}
