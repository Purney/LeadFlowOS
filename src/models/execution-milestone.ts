import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { milestoneStatuses } from "@/types/execution";

const executionMilestoneSchema = new Schema(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: milestoneStatuses, required: true, default: "planned", index: true },
    dueDate: { type: Date, index: true },
    completedAt: { type: Date },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

executionMilestoneSchema.index({ organisationId: 1, projectId: 1, sortOrder: 1 });

export type ExecutionMilestoneDocument = InferSchemaType<typeof executionMilestoneSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ExecutionMilestone =
  mongoose.models.ExecutionMilestone ||
  mongoose.model("ExecutionMilestone", executionMilestoneSchema);
