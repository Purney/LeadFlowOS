import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { enrollmentStatuses } from "@/types/campaign";

const variantSelectionSchema = new Schema(
  {
    subjectIndex: { type: Number, required: true, min: 0 },
    bodyIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const campaignEnrollmentSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: enrollmentStatuses,
      required: true,
      default: "active",
      index: true,
    },
    currentStepIndex: { type: Number, required: true, default: 0, min: 0 },
    nextScheduledAt: { type: Date, required: true },
    assignedVariants: {
      type: Map,
      of: variantSelectionSchema,
      default: {},
    },
  },
  { timestamps: true },
);

campaignEnrollmentSchema.index(
  { organisationId: 1, campaignId: 1, leadId: 1 },
  { unique: true },
);

export type CampaignEnrollmentDocument = InferSchemaType<
  typeof campaignEnrollmentSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const CampaignEnrollment =
  mongoose.models.CampaignEnrollment ||
  mongoose.model("CampaignEnrollment", campaignEnrollmentSchema);
