import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { proposalStatuses } from "@/types/proposal";

const proposalContentSchema = new Schema(
  {
    executiveSummary: { type: String, required: true, trim: true },
    identifiedProblem: { type: String, required: true, trim: true },
    proposedSolution: { type: String, required: true, trim: true },
    deliverables: [{ type: String, trim: true }],
    assumptions: [{ type: String, trim: true }],
    estimatedTimeline: { type: String, required: true, trim: true },
    optionalEnhancements: [{ type: String, trim: true }],
  },
  { _id: false },
);

const proposalVersionSchema = new Schema(
  {
    version: { type: Number, required: true, min: 1 },
    content: { type: proposalContentSchema, required: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const proposalSchema = new Schema(
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
    discoveryResponseId: {
      type: Schema.Types.ObjectId,
      ref: "DiscoveryResponse",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: proposalStatuses,
      required: true,
      default: "draft",
      index: true,
    },
    currentVersion: { type: Number, required: true, default: 1, min: 1 },
    content: { type: proposalContentSchema, required: true },
    versions: { type: [proposalVersionSchema], default: [] },
    sentAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true },
);

proposalSchema.index({ organisationId: 1, status: 1 });

export type ProposalDocument = InferSchemaType<typeof proposalSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Proposal =
  mongoose.models.Proposal || mongoose.model("Proposal", proposalSchema);
