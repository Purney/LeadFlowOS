import mongoose, { type InferSchemaType, Schema } from "mongoose";
import {
  defaultResearchChecklist,
  researchPriorities,
  researchStatuses,
} from "@/types/research";

const checklistItemSchema = new Schema(
  {
    itemId: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    completed: { type: Boolean, required: true, default: false },
    completedAt: { type: Date },
  },
  { _id: false },
);

const clientResearchSchema = new Schema(
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
      required: false,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    industry: { type: String, trim: true },
    companySize: { type: String, trim: true },
    region: { type: String, trim: true },
    decisionMakerName: { type: String, trim: true },
    decisionMakerRole: { type: String, trim: true },
    decisionMakerEmail: { type: String, lowercase: true, trim: true },
    source: { type: String, trim: true },
    currentProvider: { type: String, trim: true },
    competitors: [{ type: String, trim: true }],
    painHypotheses: [{ type: String, trim: true }],
    opportunityIdeas: [{ type: String, trim: true }],
    positiveSignals: [{ type: String, trim: true }],
    negativeSignals: [{ type: String, trim: true }],
    checklist: {
      type: [checklistItemSchema],
      default: () =>
        defaultResearchChecklist.map((label, index) => ({
          itemId: `research-${index + 1}`,
          label,
          completed: false,
        })),
    },
    fitScore: { type: Number, required: true, min: 0, max: 100, default: 50 },
    priority: {
      type: String,
      enum: researchPriorities,
      required: true,
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: researchStatuses,
      required: true,
      default: "draft",
      index: true,
    },
    notes: { type: String, trim: true },
    outreachAngle: { type: String, trim: true },
    aiSummary: { type: Schema.Types.Mixed },
    nextAction: { type: String, trim: true },
    researchedAt: { type: Date },
  },
  { timestamps: true },
);

clientResearchSchema.index({ organisationId: 1, status: 1, priority: 1 });
clientResearchSchema.index({ organisationId: 1, fitScore: -1 });
clientResearchSchema.index({
  companyName: "text",
  website: "text",
  industry: "text",
  decisionMakerName: "text",
  notes: "text",
});

export type ClientResearchDocument = InferSchemaType<
  typeof clientResearchSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const ClientResearch =
  mongoose.models.ClientResearch ||
  mongoose.model("ClientResearch", clientResearchSchema);
