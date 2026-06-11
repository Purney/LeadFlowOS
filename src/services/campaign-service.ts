import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Campaign } from "@/models/campaign";
import { CampaignEnrollment } from "@/models/campaign-enrollment";
import { Lead } from "@/models/lead";
import { createActivity } from "@/services/activity-service";
import { campaignInputSchema, campaignUpdateSchema, type CampaignInput, type CampaignUpdateInput, type CampaignEnrollInput, campaignEnrollSchema } from "@/validation/campaign";
import { allocateVariant, scheduleCampaignStep } from "@/utils/campaign-scheduling";

type ActorContext = {
  organisationId: string;
  userId: string;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function buildSteps(input: CampaignInput["steps"]) {
  return input.map((step, index) => ({
    ...step,
    order: index,
  }));
}

export async function listCampaigns(organisationId: string) {
  await connectToDatabase();

  const campaigns = await Campaign.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
  const enrollmentCounts = await CampaignEnrollment.aggregate([
    { $match: { organisationId: toObjectId(organisationId) } },
    { $group: { _id: "$campaignId", count: { $sum: 1 } } },
  ]);
  const counts = new Map(
    enrollmentCounts.map((item) => [String(item._id), item.count as number]),
  );

  return campaigns.map((campaign) => ({
    ...campaign,
    enrollmentCount: counts.get(String(campaign._id)) ?? 0,
  }));
}

export async function getCampaignMetrics(organisationId: string) {
  await connectToDatabase();

  const [total, active] = await Promise.all([
    Campaign.countDocuments({ organisationId: toObjectId(organisationId) }),
    Campaign.countDocuments({
      organisationId: toObjectId(organisationId),
      status: "active",
    }),
  ]);

  return { total, active };
}

export async function createCampaign(context: ActorContext, input: CampaignInput) {
  const data = campaignInputSchema.parse(input);
  await connectToDatabase();

  const campaign = await Campaign.create({
    ...data,
    steps: buildSteps(data.steps),
    organisationId: toObjectId(context.organisationId),
    createdByUserId: toObjectId(context.userId),
  });

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "campaign",
    entityId: campaign._id.toString(),
    action: "campaign.created",
    metadata: { status: campaign.status, steps: campaign.steps.length },
  });

  return campaign;
}

export async function updateCampaign(
  context: ActorContext,
  campaignId: string,
  input: CampaignUpdateInput,
) {
  const data = campaignUpdateSchema.parse(input);
  await connectToDatabase();

  const update = {
    ...data,
    ...(data.steps ? { steps: buildSteps(data.steps) } : {}),
  };
  const campaign = await Campaign.findOneAndUpdate(
    {
      _id: toObjectId(campaignId),
      organisationId: toObjectId(context.organisationId),
    },
    { $set: update },
    { returnDocument: "after" },
  );

  if (!campaign) {
    return null;
  }

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "campaign",
    entityId: campaign._id.toString(),
    action: "campaign.updated",
    metadata: { status: campaign.status },
  });

  return campaign;
}

export async function enrollLeadsInCampaign(
  context: ActorContext,
  campaignId: string,
  input: CampaignEnrollInput,
) {
  const data = campaignEnrollSchema.parse(input);
  await connectToDatabase();

  const campaign = await Campaign.findOne({
    _id: toObjectId(campaignId),
    organisationId: toObjectId(context.organisationId),
  });

  if (!campaign || campaign.steps.length === 0) {
    return null;
  }

  const leads = await Lead.find({
    _id: { $in: data.leadIds.map(toObjectId) },
    organisationId: toObjectId(context.organisationId),
  })
    .select("_id")
    .lean();
  const startAt = data.startAt ?? new Date();
  const firstStep = campaign.steps[0];
  const nextScheduledAt = scheduleCampaignStep(startAt, firstStep.delayDays);
  const existing = await CampaignEnrollment.find({
    organisationId: toObjectId(context.organisationId),
    campaignId: campaign._id,
    leadId: { $in: leads.map((lead) => lead._id) },
  })
    .select("leadId")
    .lean();
  const existingLeadIds = new Set(existing.map((item) => String(item.leadId)));
  const toCreate = leads.filter((lead) => !existingLeadIds.has(String(lead._id)));

  const created =
    toCreate.length > 0
      ? await CampaignEnrollment.insertMany(
          toCreate.map((lead) => ({
            organisationId: toObjectId(context.organisationId),
            campaignId: campaign._id,
            leadId: lead._id,
            status: "active",
            currentStepIndex: 0,
            nextScheduledAt,
            assignedVariants: {
              "0": allocateVariant(
                `${campaign._id}:${lead._id}:0`,
                firstStep.subjectVariants.length,
                firstStep.bodyVariants.length,
              ),
            },
          })),
          { ordered: false },
        )
      : [];

  await createActivity({
    organisationId: context.organisationId,
    actorUserId: context.userId,
    entityType: "campaign",
    entityId: campaign._id.toString(),
    action: "campaign.enrolled_leads",
    metadata: { requested: data.leadIds.length, created: created.length },
  });

  return {
    requested: data.leadIds.length,
    matched: leads.length,
    created: created.length,
    skippedExisting: existing.length,
    nextScheduledAt,
  };
}
