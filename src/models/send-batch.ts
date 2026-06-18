import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { sendBatchStatuses } from "@/types/sending";

const sendBatchRecipientSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    company: { type: String, trim: true },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const sendBatchSchema = new Schema(
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
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    sendingAccountId: {
      type: Schema.Types.ObjectId,
      ref: "EmailAccount",
      required: true,
      index: true,
    },
    recipients: { type: [sendBatchRecipientSchema], default: [] },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    subjectTemplate: { type: String, trim: true },
    bodyTemplate: { type: String, trim: true },
    variantLabel: { type: String, required: true, trim: true },
    scheduledSendTime: { type: Date, required: true, index: true },
    estimatedVolume: { type: Number, required: true, min: 0 },
    riskWarnings: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: sendBatchStatuses,
      required: true,
      default: "pending_approval",
      index: true,
    },
    approvedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true },
);

sendBatchSchema.index({ organisationId: 1, status: 1, scheduledSendTime: 1 });

export type SendBatchDocument = InferSchemaType<typeof sendBatchSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SendBatch =
  mongoose.models.SendBatch || mongoose.model("SendBatch", sendBatchSchema);
