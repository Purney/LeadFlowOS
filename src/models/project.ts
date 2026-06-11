import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { projectStatuses, projectTypes } from "@/types/client";

const projectSchema = new Schema(
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
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: projectTypes, required: true },
    status: {
      type: String,
      enum: projectStatuses,
      required: true,
      default: "planned",
      index: true,
    },
    estimatedValue: { type: Number, required: true, default: 0, min: 0 },
    actualRevenue: { type: Number, required: true, default: 0, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true },
);

projectSchema.index({ organisationId: 1, status: 1 });

export type ProjectDocument = InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
