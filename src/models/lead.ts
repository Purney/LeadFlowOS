import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { leadStatuses } from "@/types/lead";

const leadSchema = new Schema(
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
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    website: { type: String, trim: true },
    role: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    source: { type: String, trim: true },
    status: {
      type: String,
      enum: leadStatuses,
      required: true,
      default: "discovery_booked",
      index: true,
    },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

leadSchema.index({ organisationId: 1, email: 1 }, { unique: true });
leadSchema.index({
  firstName: "text",
  lastName: "text",
  email: "text",
  company: "text",
  role: "text",
  source: "text",
});

export type LeadDocument = InferSchemaType<typeof leadSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
