import mongoose, { type InferSchemaType, Schema } from "mongoose";

const emailEventSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    emailMessageId: { type: Schema.Types.ObjectId, ref: "EmailMessage", index: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    sendBatchId: { type: Schema.Types.ObjectId, ref: "SendBatch", index: true },
    eventType: { type: String, required: true, trim: true, index: true },
    providerMessageId: { type: String, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    occurredAt: { type: Date, required: true },
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

emailEventSchema.index({ organisationId: 1, eventType: 1, occurredAt: -1 });

export type EmailEventDocument = InferSchemaType<typeof emailEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmailEvent =
  mongoose.models.EmailEvent ||
  mongoose.model("EmailEvent", emailEventSchema);
