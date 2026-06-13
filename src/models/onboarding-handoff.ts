import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { handoffStatuses, paymentGateStatuses } from "@/types/handoff";

const onboardingHandoffSchema = new Schema(
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
    dealId: { type: Schema.Types.ObjectId, ref: "Deal", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    portalAccessId: { type: Schema.Types.ObjectId, ref: "PortalAccess", index: true },
    signatureRequestId: {
      type: Schema.Types.ObjectId,
      ref: "SignatureRequest",
      index: true,
    },
    status: {
      type: String,
      enum: handoffStatuses,
      required: true,
      default: "in_progress",
      index: true,
    },
    requirePaymentBeforeKickoff: {
      type: Boolean,
      required: true,
      default: true,
    },
    paymentStatus: {
      type: String,
      enum: paymentGateStatuses,
      required: true,
      default: "pending",
      index: true,
    },
    paymentDueCents: { type: Number, required: true, min: 0, default: 0 },
    paymentDescription: { type: String, trim: true },
    portalTokenIssuedAt: { type: Date },
    onboardingTasksCreated: { type: Number, required: true, default: 0 },
    kickoffNotes: { type: String, trim: true },
    readyForExecutionAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

onboardingHandoffSchema.index({ organisationId: 1, status: 1, createdAt: -1 });
onboardingHandoffSchema.index({ organisationId: 1, dealId: 1 }, { unique: true });

export type OnboardingHandoffDocument = InferSchemaType<
  typeof onboardingHandoffSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const OnboardingHandoff =
  mongoose.models.OnboardingHandoff ||
  mongoose.model("OnboardingHandoff", onboardingHandoffSchema);
