import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { maintenanceTaskStatuses } from "@/types/maintenance";

const maintenanceTaskSchema = new Schema(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    planId: { type: Schema.Types.ObjectId, ref: "MaintenancePlan", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date, index: true },
    status: { type: String, enum: maintenanceTaskStatuses, required: true, default: "scheduled", index: true },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

maintenanceTaskSchema.index({ organisationId: 1, status: 1, dueDate: 1 });

export type MaintenanceTaskDocument = InferSchemaType<typeof maintenanceTaskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MaintenanceTask =
  mongoose.models.MaintenanceTask ||
  mongoose.model("MaintenanceTask", maintenanceTaskSchema);
