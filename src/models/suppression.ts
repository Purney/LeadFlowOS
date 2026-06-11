import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { suppressionReasons } from "@/types/sending";

const suppressionSchema = new Schema(
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
    email: { type: String, required: true, lowercase: true, trim: true },
    reason: { type: String, enum: suppressionReasons, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

suppressionSchema.index({ organisationId: 1, email: 1 }, { unique: true });

export type SuppressionDocument = InferSchemaType<typeof suppressionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Suppression =
  mongoose.models.Suppression ||
  mongoose.model("Suppression", suppressionSchema);
