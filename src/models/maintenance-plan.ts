import mongoose, { type InferSchemaType, Schema } from "mongoose";
import {
  clientHealthStatuses,
  maintenanceCadences,
  maintenancePlanStatuses,
} from "@/types/maintenance";

const maintenancePlanSchema = new Schema(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    name: { type: String, required: true, trim: true },
    cadence: { type: String, enum: maintenanceCadences, required: true, default: "monthly" },
    monthlyFeeCents: { type: Number, required: true, min: 0, default: 0 },
    includedHours: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: maintenancePlanStatuses, required: true, default: "active", index: true },
    health: { type: String, enum: clientHealthStatuses, required: true, default: "healthy", index: true },
    renewalDate: { type: Date, index: true },
    nextCheckInDate: { type: Date, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

maintenancePlanSchema.index({ organisationId: 1, status: 1, renewalDate: 1 });

export type MaintenancePlanDocument = InferSchemaType<typeof maintenancePlanSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MaintenancePlan =
  mongoose.models.MaintenancePlan ||
  mongoose.model("MaintenancePlan", maintenancePlanSchema);
