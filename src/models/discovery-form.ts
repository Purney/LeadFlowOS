import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { discoveryFieldTypes, discoveryFormStatuses } from "@/types/discovery";

const discoveryFieldSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: discoveryFieldTypes, required: true },
    required: { type: Boolean, required: true, default: false },
    options: [{ type: String, trim: true }],
  },
  { _id: false },
);

const discoveryFormSchema = new Schema(
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
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: discoveryFormStatuses,
      required: true,
      default: "draft",
      index: true,
    },
    publicSlug: { type: String, required: true, unique: true, index: true },
    fields: { type: [discoveryFieldSchema], default: [] },
  },
  { timestamps: true },
);

discoveryFormSchema.index({ organisationId: 1, status: 1 });

export type DiscoveryFormDocument = InferSchemaType<typeof discoveryFormSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DiscoveryForm =
  mongoose.models.DiscoveryForm ||
  mongoose.model("DiscoveryForm", discoveryFormSchema);
