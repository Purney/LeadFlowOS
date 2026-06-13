import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { executionTaskStatuses } from "@/types/execution";

const executionTaskSchema = new Schema(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: "ExecutionMilestone", index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assigneeName: { type: String, trim: true },
    status: { type: String, enum: executionTaskStatuses, required: true, default: "todo", index: true },
    dueDate: { type: Date, index: true },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

executionTaskSchema.index({ organisationId: 1, projectId: 1, status: 1 });

export type ExecutionTaskDocument = InferSchemaType<typeof executionTaskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ExecutionTask =
  mongoose.models.ExecutionTask ||
  mongoose.model("ExecutionTask", executionTaskSchema);
