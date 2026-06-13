import mongoose from "mongoose";
import { Client } from "@/models/client";
import { Deal } from "@/models/deal";
import { OnboardingHandoff } from "@/models/onboarding-handoff";
import { connectToDatabase } from "@/lib/db";
import { createActivity } from "@/services/activity-service";
import { convertLeadToClient, createClient, createProject } from "@/services/client-service";
import {
  createLifecycleTimelineEvent,
  updateLifecycleAccount,
} from "@/services/lifecycle-service";
import {
  createPortalAccess,
  createSignatureRequest,
  runOnboardingAutomation,
} from "@/services/portal-service";
import {
  onboardingHandoffInputSchema,
  onboardingHandoffUpdateSchema,
  type OnboardingHandoffInput,
  type OnboardingHandoffUpdateInput,
} from "@/validation/handoff";

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

function serializeHandoff(handoff: Record<string, unknown>) {
  const id = handoff._id as mongoose.Types.ObjectId;
  const dealId = handoff.dealId as mongoose.Types.ObjectId;
  const clientId = handoff.clientId as mongoose.Types.ObjectId;
  const projectId = handoff.projectId as mongoose.Types.ObjectId | undefined;
  const portalAccessId = handoff.portalAccessId as mongoose.Types.ObjectId | undefined;
  const signatureRequestId = handoff.signatureRequestId as
    | mongoose.Types.ObjectId
    | undefined;
  const createdAt = handoff.createdAt as Date | undefined;

  return {
    id: id.toString(),
    dealId: dealId.toString(),
    clientId: clientId.toString(),
    projectId: projectId?.toString(),
    portalAccessId: portalAccessId?.toString(),
    signatureRequestId: signatureRequestId?.toString(),
    status: handoff.status as string,
    paymentStatus: handoff.paymentStatus as string,
    paymentDueCents: handoff.paymentDueCents as number,
    paymentDescription: handoff.paymentDescription as string | undefined,
    requirePaymentBeforeKickoff: handoff.requirePaymentBeforeKickoff as boolean,
    onboardingTasksCreated: handoff.onboardingTasksCreated as number,
    kickoffNotes: handoff.kickoffNotes as string | undefined,
    createdAt: createdAt?.toISOString(),
  };
}

async function findOrCreateClient(context: ActorContext, deal: {
  leadId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}) {
  if (deal.clientId) {
    return Client.findOne({
      _id: deal.clientId,
      organisationId: toObjectId(context.organisationId),
    });
  }

  if (deal.leadId) {
    return convertLeadToClient(context, {
      leadId: deal.leadId.toString(),
      notes: cleanString(deal.notes),
      stripeCustomerId: undefined,
    });
  }

  return createClient(context, {
    company: deal.companyName,
    contacts: deal.contactEmail
      ? [
          {
            name: cleanString(deal.contactName),
            email: deal.contactEmail,
            role: undefined,
            phone: undefined,
          },
        ]
      : [],
    notes: cleanString(deal.notes),
    stripeCustomerId: undefined,
  });
}

export async function listOnboardingHandoffs(organisationId: string) {
  await connectToDatabase();
  const handoffs = await OnboardingHandoff.find({
    organisationId: toObjectId(organisationId),
  })
    .sort({ createdAt: -1 })
    .lean();

  return handoffs.map(serializeHandoff);
}

export async function createOnboardingHandoff(
  context: ActorContext,
  input: OnboardingHandoffInput,
) {
  const data = onboardingHandoffInputSchema.parse(input);
  await connectToDatabase();

  const existing = await OnboardingHandoff.findOne({
    organisationId: toObjectId(context.organisationId),
    dealId: toObjectId(data.dealId),
  });
  if (existing) return { handoff: existing, portalToken: undefined };

  const deal = await Deal.findOne({
    _id: toObjectId(data.dealId),
    organisationId: toObjectId(context.organisationId),
    status: "won",
  });
  if (!deal) return null;

  const client = await findOrCreateClient(context, deal);
  if (!client) return null;

  deal.clientId = client._id;
  await deal.save();

  const project =
    data.createProject
      ? await createProject(context, {
          clientId: client._id.toString(),
          name: data.projectName ?? `${deal.companyName} kickoff`,
          type: data.projectType,
          status: "planned",
          estimatedValue: Math.round(deal.valueCents / 100),
          actualRevenue: 0,
        })
      : null;

  const portalAccess = data.createPortalAccess
    ? await createPortalAccess(context, {
        clientId: client._id.toString(),
        label: `${client.company} onboarding portal`,
      })
    : null;

  const tasks = data.runTaskAutomation
    ? await runOnboardingAutomation(context, {
        clientId: client._id.toString(),
        projectId: project?._id.toString(),
      })
    : [];

  const signerName =
    cleanString(data.signerName) ||
    cleanString(deal.contactName) ||
    client.contacts?.[0]?.name ||
    client.company;
  const signerEmail =
    cleanString(data.signerEmail) ||
    cleanString(deal.contactEmail) ||
    client.contacts?.[0]?.email;
  const signature =
    data.createSignatureRequest && signerEmail
      ? await createSignatureRequest(context, {
          clientId: client._id.toString(),
          proposalId: deal.proposalId?.toString(),
          title: `${client.company} agreement`,
          signerName,
          signerEmail,
          termsMarkdown:
            cleanString(data.contractTerms) ??
            `Agreement terms for ${deal.title}. Final contract content should be reviewed before signing.`,
          status: "sent",
          useExternalProvider: false,
        })
      : null;

  const paymentStatus =
    data.requirePaymentBeforeKickoff && data.paymentDueCents > 0
      ? "pending"
      : "not_required";
  const handoff = await OnboardingHandoff.create({
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    dealId: deal._id,
    clientId: client._id,
    projectId: project?._id,
    portalAccessId: portalAccess?.access._id,
    signatureRequestId: signature?._id,
    status: "in_progress",
    requirePaymentBeforeKickoff: data.requirePaymentBeforeKickoff,
    paymentStatus,
    paymentDueCents: data.paymentDueCents,
    paymentDescription: cleanString(data.paymentDescription),
    portalTokenIssuedAt: portalAccess ? new Date() : undefined,
    onboardingTasksCreated: tasks.length,
    kickoffNotes: cleanString(data.kickoffNotes),
  });

  await updateLifecycleAccount(context, deal.lifecycleAccountId.toString(), {
    clientId: client._id.toString(),
    stage: "onboarding_payment",
    status: paymentStatus === "pending" ? "blocked" : "active",
    nextAction:
      paymentStatus === "pending"
        ? "Collect kickoff payment"
        : "Complete onboarding checklist",
    tags: ["onboarding", "payment"],
  });
  await createLifecycleTimelineEvent({
    organisationId: context.organisationId,
    accountId: deal.lifecycleAccountId.toString(),
    actorUserId: context.userId,
    stage: "onboarding_payment",
    entityType: "onboarding_handoff",
    entityId: handoff._id.toString(),
    action: "handoff.created",
    title: "Onboarding handoff created",
    metadata: {
      dealId: deal._id.toString(),
      clientId: client._id.toString(),
      projectId: project?._id.toString(),
      paymentStatus,
    },
  });
  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "onboarding_handoff",
    entityId: handoff._id.toString(),
    action: "handoff.created",
    metadata: {
      dealId: deal._id.toString(),
      clientId: client._id.toString(),
      tasks: tasks.length,
    },
  });

  return { handoff, portalToken: portalAccess?.token };
}

export async function updateOnboardingHandoff(
  context: ActorContext,
  handoffId: string,
  input: OnboardingHandoffUpdateInput,
) {
  const data = onboardingHandoffUpdateSchema.parse(input);
  await connectToDatabase();

  const handoff = await OnboardingHandoff.findOneAndUpdate(
    {
      _id: toObjectId(handoffId),
      organisationId: toObjectId(context.organisationId),
    },
    {
      $set: {
        ...data,
        kickoffNotes: cleanString(data.kickoffNotes),
        readyForExecutionAt:
          data.status === "ready_for_execution" ? new Date() : undefined,
        completedAt: data.status === "completed" ? new Date() : undefined,
      },
    },
    { returnDocument: "after" },
  );

  if (!handoff) return null;

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "onboarding_handoff",
    entityId: handoff._id.toString(),
    action: "handoff.updated",
    metadata: { status: handoff.status, paymentStatus: handoff.paymentStatus },
  });

  return handoff;
}

export async function getHandoffMetrics(organisationId: string) {
  await connectToDatabase();
  const orgId = toObjectId(organisationId);
  const [total, byStatus, paymentPending, ready] = await Promise.all([
    OnboardingHandoff.countDocuments({ organisationId: orgId }),
    OnboardingHandoff.aggregate([
      { $match: { organisationId: orgId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    OnboardingHandoff.countDocuments({
      organisationId: orgId,
      paymentStatus: "pending",
    }),
    OnboardingHandoff.countDocuments({
      organisationId: orgId,
      status: "ready_for_execution",
    }),
  ]);

  return {
    total,
    paymentPending,
    ready,
    byStatus: Object.fromEntries(
      byStatus.map((item) => [item._id as string, item.count as number]),
    ),
  };
}
