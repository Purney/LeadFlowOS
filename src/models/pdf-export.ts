import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { pdfExportStatuses } from "@/types/portal";

const pdfExportSchema = new Schema(
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
    clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", index: true },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: pdfExportStatuses,
      required: true,
      default: "generated",
      index: true,
    },
    format: { type: String, required: true, default: "html" },
    html: { type: String, required: true },
  },
  { timestamps: true },
);

pdfExportSchema.index({ organisationId: 1, clientId: 1 });

export type PdfExportDocument = InferSchemaType<typeof pdfExportSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PdfExport =
  mongoose.models.PdfExport || mongoose.model("PdfExport", pdfExportSchema);
