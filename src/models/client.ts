import mongoose, { type InferSchemaType, Schema } from "mongoose";

const clientContactSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false },
);

const clientSchema = new Schema(
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
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    company: { type: String, required: true, trim: true },
    contacts: { type: [clientContactSchema], default: [] },
    notes: { type: String, trim: true },
    stripeCustomerId: { type: String, trim: true, index: true },
  },
  { timestamps: true },
);

clientSchema.index({ organisationId: 1, company: 1 });

export type ClientDocument = InferSchemaType<typeof clientSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);
