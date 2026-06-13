import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { deliverableStatuses } from "@/types/execution";

const deliverableSchema = new Schema(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    url: { type: String, trim: true },
    status: { type: String, enum: deliverableStatuses, required: true, default: "draft", index: true },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

deliverableSchema.index({ organisationId: 1, projectId: 1, status: 1 });

export type DeliverableDocument = InferSchemaType<typeof deliverableSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Deliverable =
  mongoose.models.Deliverable || mongoose.model("Deliverable", deliverableSchema);
