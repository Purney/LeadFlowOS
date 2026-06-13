import mongoose, { type InferSchemaType, Schema } from "mongoose";
import {
  dmarcPolicies,
  emailProviders,
  reputationStatuses,
  verificationStatuses,
  warmupStatuses,
} from "@/types/sending";

const emailHealthSchema = new Schema(
  {
    spfConfigured: { type: Boolean, default: false },
    dkimConfigured: { type: Boolean, default: false },
    dmarcConfigured: { type: Boolean, default: false },
    dmarcPolicy: { type: String, enum: dmarcPolicies, default: "none" },
    forwardReverseDnsConfigured: { type: Boolean, default: false },
    tlsEnabled: { type: Boolean, default: false },
    trackingDomainConfigured: { type: Boolean, default: false },
    unsubscribeSupported: { type: Boolean, default: true },
    oneClickUnsubscribeSupported: { type: Boolean, default: false },
    blocklistDetected: { type: Boolean, default: false },
    bounceRate: { type: Number, default: 0, min: 0, max: 1 },
    spamComplaintRate: { type: Number, default: 0, min: 0, max: 1 },
    deferralRate: { type: Number, default: 0, min: 0, max: 1 },
  },
  { _id: false },
);

const emailAccountSchema = new Schema(
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
    email: { type: String, required: true, lowercase: true, trim: true },
    domain: { type: String, required: true, lowercase: true, trim: true, index: true },
    provider: { type: String, enum: emailProviders, required: true, default: "sendgrid" },
    sendGridSenderId: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: verificationStatuses,
      required: true,
      default: "not_configured",
      index: true,
    },
    dailySendLimit: { type: Number, required: true, min: 1, default: 25 },
    perDomainDailyLimit: { type: Number, required: true, min: 1, default: 5 },
    warmupTargetDailyVolume: { type: Number, required: true, min: 1, default: 75 },
    warmupStatus: {
      type: String,
      enum: warmupStatuses,
      required: true,
      default: "not_started",
      index: true,
    },
    warmupStartedAt: { type: Date },
    reputationStatus: {
      type: String,
      enum: reputationStatuses,
      required: true,
      default: "unknown",
      index: true,
    },
    lastDeliverabilityReviewAt: { type: Date },
    active: { type: Boolean, required: true, default: true, index: true },
    health: { type: emailHealthSchema, default: {} },
  },
  { timestamps: true },
);

emailAccountSchema.index({ organisationId: 1, email: 1 }, { unique: true });

export type EmailAccountDocument = InferSchemaType<typeof emailAccountSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmailAccount =
  mongoose.models.EmailAccount ||
  mongoose.model("EmailAccount", emailAccountSchema);
