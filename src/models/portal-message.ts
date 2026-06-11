import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { portalMessageAuthors } from "@/types/portal";

const portalMessageSchema = new Schema(
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
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    authorType: {
      type: String,
      enum: portalMessageAuthors,
      required: true,
      index: true,
    },
    authorName: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    readAt: { type: Date },
  },
  { timestamps: true },
);

portalMessageSchema.index({ organisationId: 1, clientId: 1, createdAt: -1 });

export type PortalMessageDocument = InferSchemaType<
  typeof portalMessageSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const PortalMessage =
  mongoose.models.PortalMessage ||
  mongoose.model("PortalMessage", portalMessageSchema);
