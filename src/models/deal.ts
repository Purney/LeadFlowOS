import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { dealStages, dealStatuses } from "@/types/sales";

const dealSchema = new Schema(
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
    lifecycleAccountId: {
      type: Schema.Types.ObjectId,
      ref: "LifecycleAccount",
      required: true,
      index: true,
    },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true },
    contactEmail: { type: String, lowercase: true, trim: true },
    valueCents: { type: Number, required: true, min: 0, default: 0 },
    probability: { type: Number, required: true, min: 0, max: 100, default: 25 },
    stage: {
      type: String,
      enum: dealStages,
      required: true,
      default: "discovery_booked",
      index: true,
    },
    status: {
      type: String,
      enum: dealStatuses,
      required: true,
      default: "active",
      index: true,
    },
    expectedCloseDate: { type: Date, index: true },
    nextAction: { type: String, trim: true },
    nextActionDueAt: { type: Date, index: true },
    notes: { type: String, trim: true },
    wonReason: { type: String, trim: true },
    lostReason: { type: String, trim: true },
    wonAt: { type: Date },
    lostAt: { type: Date },
  },
  { timestamps: true },
);

dealSchema.index({ organisationId: 1, stage: 1, status: 1 });
dealSchema.index({ organisationId: 1, expectedCloseDate: 1 });
dealSchema.index({
  title: "text",
  companyName: "text",
  contactName: "text",
  contactEmail: "text",
  notes: "text",
});

export type DealDocument = InferSchemaType<typeof dealSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Deal = mongoose.models.Deal || mongoose.model("Deal", dealSchema);
