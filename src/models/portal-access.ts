import mongoose, { type InferSchemaType, Schema } from "mongoose";

const portalAccessSchema = new Schema(
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
    tokenHash: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true, trim: true },
    expiresAt: { type: Date },
    revokedAt: { type: Date },
    lastViewedAt: { type: Date },
  },
  { timestamps: true },
);

portalAccessSchema.index({ organisationId: 1, clientId: 1 });

export type PortalAccessDocument = InferSchemaType<typeof portalAccessSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PortalAccess =
  mongoose.models.PortalAccess ||
  mongoose.model("PortalAccess", portalAccessSchema);
