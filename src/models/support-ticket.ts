import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { supportTicketPriorities, supportTicketStatuses } from "@/types/maintenance";

const supportTicketSchema = new Schema(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: supportTicketPriorities, required: true, default: "medium", index: true },
    status: { type: String, enum: supportTicketStatuses, required: true, default: "open", index: true },
    dueDate: { type: Date, index: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

supportTicketSchema.index({ organisationId: 1, status: 1, priority: 1 });

export type SupportTicketDocument = InferSchemaType<typeof supportTicketSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);
