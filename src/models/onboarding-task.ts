import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { onboardingTaskStatuses } from "@/types/portal";

const onboardingTaskSchema = new Schema(
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
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: onboardingTaskStatuses,
      required: true,
      default: "pending",
      index: true,
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

onboardingTaskSchema.index({ organisationId: 1, clientId: 1, status: 1 });

export type OnboardingTaskDocument = InferSchemaType<typeof onboardingTaskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const OnboardingTask =
  mongoose.models.OnboardingTask ||
  mongoose.model("OnboardingTask", onboardingTaskSchema);
