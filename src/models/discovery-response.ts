import mongoose, { type InferSchemaType, Schema } from "mongoose";

const discoveryResponseSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    discoveryFormId: {
      type: Schema.Types.ObjectId,
      ref: "DiscoveryForm",
      required: true,
      index: true,
    },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    respondentEmail: { type: String, lowercase: true, trim: true },
    respondentName: { type: String, trim: true },
    answers: { type: Schema.Types.Mixed, required: true, default: {} },
    submittedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

discoveryResponseSchema.index({ organisationId: 1, submittedAt: -1 });

export type DiscoveryResponseDocument = InferSchemaType<
  typeof discoveryResponseSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const DiscoveryResponse =
  mongoose.models.DiscoveryResponse ||
  mongoose.model("DiscoveryResponse", discoveryResponseSchema);
