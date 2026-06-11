import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { signatureRequestStatuses } from "@/types/portal";

const signatureRequestSchema = new Schema(
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
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", index: true },
    title: { type: String, required: true, trim: true },
    signerName: { type: String, required: true, trim: true },
    signerEmail: { type: String, required: true, lowercase: true, trim: true },
    termsMarkdown: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: signatureRequestStatuses,
      required: true,
      default: "sent",
      index: true,
    },
    provider: { type: String, trim: true },
    providerEnvelopeId: { type: String, trim: true, index: true },
    providerStatus: { type: String, trim: true },
    providerSigningUrl: { type: String, trim: true },
    signatureText: { type: String, trim: true },
    signedAt: { type: Date },
    declinedAt: { type: Date },
  },
  { timestamps: true },
);

signatureRequestSchema.index({ organisationId: 1, clientId: 1, status: 1 });

export type SignatureRequestDocument = InferSchemaType<
  typeof signatureRequestSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const SignatureRequest =
  mongoose.models.SignatureRequest ||
  mongoose.model("SignatureRequest", signatureRequestSchema);
