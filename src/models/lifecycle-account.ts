import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { lifecycleStages, lifecycleStatuses } from "@/types/lifecycle";

const lifecycleAccountSchema = new Schema(
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
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", index: true },
    name: { type: String, required: true, trim: true },
    primaryEmail: { type: String, lowercase: true, trim: true },
    website: { type: String, trim: true },
    source: { type: String, trim: true },
    stage: {
      type: String,
      enum: lifecycleStages,
      required: true,
      default: "client_research",
      index: true,
    },
    status: {
      type: String,
      enum: lifecycleStatuses,
      required: true,
      default: "active",
      index: true,
    },
    fitScore: { type: Number, min: 0, max: 100 },
    notes: { type: String, trim: true },
    nextAction: { type: String, trim: true },
    nextActionDueAt: { type: Date, index: true },
    tags: [{ type: String, trim: true }],
    stripeCustomerId: { type: String, trim: true, index: true },
    lastActivityAt: { type: Date, index: true },
  },
  { timestamps: true },
);

lifecycleAccountSchema.index({ organisationId: 1, stage: 1, status: 1 });
lifecycleAccountSchema.index({ organisationId: 1, leadId: 1 }, { sparse: true });
lifecycleAccountSchema.index({ organisationId: 1, clientId: 1 }, { sparse: true });
lifecycleAccountSchema.index({
  name: "text",
  primaryEmail: "text",
  website: "text",
  source: "text",
  notes: "text",
});

export type LifecycleAccountDocument = InferSchemaType<
  typeof lifecycleAccountSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const LifecycleAccount =
  mongoose.models.LifecycleAccount ||
  mongoose.model("LifecycleAccount", lifecycleAccountSchema);
