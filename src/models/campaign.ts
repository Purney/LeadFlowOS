import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { campaignStatuses } from "@/types/campaign";

const campaignStepSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 0 },
    delayDays: { type: Number, required: true, min: 0, default: 0 },
    subjectVariants: [{ type: String, required: true, trim: true }],
    bodyVariants: [{ type: String, required: true, trim: true }],
  },
  { _id: true },
);

const campaignSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    goal: { type: String, trim: true },
    serviceOffer: { type: String, trim: true },
    status: {
      type: String,
      enum: campaignStatuses,
      required: true,
      default: "draft",
      index: true,
    },
    steps: { type: [campaignStepSchema], default: [] },
  },
  { timestamps: true },
);

campaignSchema.index({ organisationId: 1, status: 1 });

export type CampaignDocument = InferSchemaType<typeof campaignSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Campaign =
  mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
