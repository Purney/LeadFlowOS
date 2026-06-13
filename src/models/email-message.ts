import mongoose, { type InferSchemaType, Schema } from "mongoose";
import {
  emailMessageDirections,
  emailMessageStatuses,
} from "@/types/sending";

const emailMessageSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    sendBatchId: { type: Schema.Types.ObjectId, ref: "SendBatch", index: true },
    emailAccountId: { type: Schema.Types.ObjectId, ref: "EmailAccount", index: true },
    direction: {
      type: String,
      enum: emailMessageDirections,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: emailMessageStatuses,
      required: true,
      default: "queued",
      index: true,
    },
    provider: { type: String, trim: true, default: "mailgun" },
    providerMessageId: { type: String, trim: true, index: true },
    from: { type: String, required: true, lowercase: true, trim: true },
    to: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    raw: { type: Schema.Types.Mixed, default: {} },
    sentAt: { type: Date },
    receivedAt: { type: Date },
  },
  { timestamps: true },
);

emailMessageSchema.index({ organisationId: 1, providerMessageId: 1 });

export type EmailMessageDocument = InferSchemaType<typeof emailMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmailMessage =
  mongoose.models.EmailMessage ||
  mongoose.model("EmailMessage", emailMessageSchema);
