import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Campaign } from "@/models/campaign";
import { CampaignEnrollment } from "@/models/campaign-enrollment";
import { EmailAccount } from "@/models/email-account";
import { Lead } from "@/models/lead";
import { SendBatch } from "@/models/send-batch";
import { createActivity } from "@/services/activity-service";
import { applyPersonalisation } from "@/utils/personalisation";
import {
  buildDeliverabilityWarnings,
  calculateHealthScore,
  recommendedSendVolume,
} from "@/utils/deliverability";
import {
  emailAccountInputSchema,
  emailAccountUpdateSchema,
  generateSendBatchSchema,
  sendBatchUpdateSchema,
  type EmailAccountInput,
  type EmailAccountUpdateInput,
  type GenerateSendBatchInput,
  type SendBatchUpdateInput,
} from "@/validation/sending";

type ActorContext = {
  organisationId: string;
  userId: string;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function accountView(account: {
  health: {
    spfConfigured: boolean;
    dkimConfigured: boolean;
    dmarcConfigured: boolean;
    trackingDomainConfigured: boolean;
    unsubscribeSupported: boolean;
    bounceRate: number;
    spamComplaintRate: number;
  };
  dailySendLimit: number;
  warmupStatus: "not_started" | "warming" | "ready" | "paused";
  warmupStartedAt?: Date;
  active: boolean;
}) {
  const healthScore = calculateHealthScore(account.health);
  const recommendedVolume = recommendedSendVolume({
    dailySendLimit: account.dailySendLimit,
    warmupStatus: account.warmupStatus,
    warmupStartedAt: account.warmupStartedAt,
    health: account.health,
  });

  return {
    healthScore,
    recommendedVolume,
  };
}

export async function listEmailAccounts(organisationId: string) {
  await connectToDatabase();

  const accounts = await EmailAccount.find({
    organisationId: toObjectId(organisationId),
  })
    .sort({ createdAt: -1 })
    .lean();

  return accounts.map((account) => ({
    ...account,
    ...accountView(account),
  }));
}

export async function createEmailAccount(
  context: ActorContext,
  input: EmailAccountInput,
) {
  const data = emailAccountInputSchema.parse(input);
  await connectToDatabase();

  const account = await EmailAccount.create({
    ...data,
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "email_account",
    entityId: account._id.toString(),
    action: "email_account.created",
    metadata: { email: account.email, domain: account.domain },
  });

  return account;
}

export async function updateEmailAccount(
  context: ActorContext,
  accountId: string,
  input: EmailAccountUpdateInput,
) {
  const data = emailAccountUpdateSchema.parse(input);
  await connectToDatabase();

  const account = await EmailAccount.findOneAndUpdate(
    {
      _id: toObjectId(accountId),
      organisationId: toObjectId(context.organisationId),
    },
    { $set: data },
    { returnDocument: "after" },
  );

  if (!account) return null;

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "email_account",
    entityId: account._id.toString(),
    action: "email_account.updated",
    metadata: { warmupStatus: account.warmupStatus, active: account.active },
  });

  return account;
}

export async function getSendingMetrics(organisationId: string) {
  await connectToDatabase();

  const [accounts, pendingApprovals] = await Promise.all([
    EmailAccount.find({ organisationId: toObjectId(organisationId) }).lean(),
    SendBatch.countDocuments({
      organisationId: toObjectId(organisationId),
      status: "pending_approval",
    }),
  ]);

  const activeAccounts = accounts.filter((account) => account.active).length;
  const averageHealth =
    accounts.length > 0
      ? Math.round(
          accounts.reduce(
            (total, account) => total + calculateHealthScore(account.health),
            0,
          ) / accounts.length,
        )
      : 0;

  return {
    accounts: accounts.length,
    activeAccounts,
    pendingApprovals,
    averageHealth,
  };
}

export async function listSendBatches(organisationId: string) {
  await connectToDatabase();

  return SendBatch.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function generateSendBatch(
  context: ActorContext,
  input: GenerateSendBatchInput,
) {
  const data = generateSendBatchSchema.parse(input);
  await connectToDatabase();

  const [campaign, account] = await Promise.all([
    Campaign.findOne({
      _id: toObjectId(data.campaignId),
      organisationId: toObjectId(context.organisationId),
    }),
    EmailAccount.findOne({
      _id: toObjectId(data.sendingAccountId),
      organisationId: toObjectId(context.organisationId),
    }),
  ]);

  if (!campaign || !account || campaign.steps.length === 0) {
    return null;
  }

  const enrollments = await CampaignEnrollment.find({
    organisationId: toObjectId(context.organisationId),
    campaignId: campaign._id,
    status: "active",
  })
    .sort({ nextScheduledAt: 1 })
    .limit(data.limit)
    .lean();

  const leadIds = enrollments.map((enrollment) => enrollment.leadId);
  const leads = await Lead.find({
    _id: { $in: leadIds },
    organisationId: toObjectId(context.organisationId),
    status: { $nin: ["replied", "won", "lost"] },
  }).lean();
  const leadById = new Map(leads.map((lead) => [String(lead._id), lead]));
  const firstEnrollment = enrollments.find((enrollment) =>
    leadById.has(String(enrollment.leadId)),
  );

  if (!firstEnrollment) {
    return {
      batch: null,
      created: 0,
      skipped: enrollments.length,
    };
  }

  const firstStep = campaign.steps[firstEnrollment.currentStepIndex] ?? campaign.steps[0];
  const variant =
    firstEnrollment.assignedVariants instanceof Map
      ? firstEnrollment.assignedVariants.get(String(firstEnrollment.currentStepIndex))
      : firstEnrollment.assignedVariants?.[String(firstEnrollment.currentStepIndex)];
  const subjectIndex = variant?.subjectIndex ?? 0;
  const bodyIndex = variant?.bodyIndex ?? 0;
  const recipients = enrollments
    .map((enrollment) => leadById.get(String(enrollment.leadId)))
    .filter(Boolean)
    .map((lead) => ({
      leadId: lead._id,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      company: lead.company,
    }));
  const sampleLead = recipients[0];
  const estimatedVolume = recipients.length;
  const recommendedVolume = recommendedSendVolume({
    dailySendLimit: account.dailySendLimit,
    warmupStatus: account.warmupStatus,
    warmupStartedAt: account.warmupStartedAt,
    health: account.health,
  });
  const riskWarnings = buildDeliverabilityWarnings({
    dailySendLimit: account.dailySendLimit,
    estimatedVolume,
    recommendedVolume,
    health: account.health,
    active: account.active,
  });
  const subjectTemplate =
    firstStep.subjectVariants[Math.min(subjectIndex, firstStep.subjectVariants.length - 1)];
  const bodyTemplate =
    firstStep.bodyVariants[Math.min(bodyIndex, firstStep.bodyVariants.length - 1)];
  const batch = await SendBatch.create({
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
    campaignId: campaign._id,
    sendingAccountId: account._id,
    recipients,
    subject: applyPersonalisation(subjectTemplate, sampleLead),
    body: applyPersonalisation(bodyTemplate, sampleLead),
    variantLabel: `step-${firstStep.order}-subject-${subjectIndex}-body-${bodyIndex}`,
    scheduledSendTime: data.scheduledSendTime ?? firstEnrollment.nextScheduledAt,
    estimatedVolume,
    riskWarnings,
    status: "pending_approval",
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "send_batch",
    entityId: batch._id.toString(),
    action: "send_batch.generated",
    metadata: {
      campaignId: campaign._id.toString(),
      sendingAccountId: account._id.toString(),
      estimatedVolume,
      riskWarnings: riskWarnings.length,
    },
  });

  return {
    batch,
    created: estimatedVolume,
    skipped: enrollments.length - estimatedVolume,
  };
}

export async function updateSendBatch(
  context: ActorContext,
  batchId: string,
  input: SendBatchUpdateInput,
) {
  const data = sendBatchUpdateSchema.parse(input);
  await connectToDatabase();

  const set: Record<string, unknown> = { ...data };
  if (data.status === "approved") {
    set.approvedByUserId = toObjectId(context.userId);
    set.approvedAt = new Date();
  }
  if (data.status === "rejected") {
    set.rejectedByUserId = toObjectId(context.userId);
    set.rejectedAt = new Date();
  }

  const batch = await SendBatch.findOneAndUpdate(
    {
      _id: toObjectId(batchId),
      organisationId: toObjectId(context.organisationId),
    },
    { $set: set },
    { returnDocument: "after" },
  );

  if (!batch) return null;

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "send_batch",
    entityId: batch._id.toString(),
    action: `send_batch.${data.status ?? "updated"}`,
  });

  return batch;
}
