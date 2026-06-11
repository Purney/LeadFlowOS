import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { aiDraftStatuses, aiDraftTypes } from "@/types/ai";

const aiDraftSchema = new Schema(
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
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    emailMessageId: { type: Schema.Types.ObjectId, ref: "EmailMessage", index: true },
    type: { type: String, enum: aiDraftTypes, required: true, index: true },
    status: {
      type: String,
      enum: aiDraftStatuses,
      required: true,
      default: "draft",
      index: true,
    },
    prompt: { type: String, required: true },
    content: { type: Schema.Types.Mixed, required: true },
    model: { type: String, trim: true },
  },
  { timestamps: true },
);

aiDraftSchema.index({ organisationId: 1, type: 1, createdAt: -1 });

export type AiDraftDocument = InferSchemaType<typeof aiDraftSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AiDraft =
  mongoose.models.AiDraft || mongoose.model("AiDraft", aiDraftSchema);
