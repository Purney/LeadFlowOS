import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { salesTaskStatuses } from "@/types/sales";

const salesTaskSchema = new Schema(
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
    dealId: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    dueAt: { type: Date, index: true },
    status: {
      type: String,
      enum: salesTaskStatuses,
      required: true,
      default: "open",
      index: true,
    },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

salesTaskSchema.index({ organisationId: 1, status: 1, dueAt: 1 });

export type SalesTaskDocument = InferSchemaType<typeof salesTaskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SalesTask =
  mongoose.models.SalesTask || mongoose.model("SalesTask", salesTaskSchema);
