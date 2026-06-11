import mongoose, { type InferSchemaType, Schema } from "mongoose";

const stripeCustomerSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    stripeCustomerId: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    name: { type: String, trim: true },
    currency: { type: String, lowercase: true, trim: true },
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

stripeCustomerSchema.index(
  { organisationId: 1, stripeCustomerId: 1 },
  { unique: true },
);

export type StripeCustomerDocument = InferSchemaType<
  typeof stripeCustomerSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const StripeCustomer =
  mongoose.models.StripeCustomer ||
  mongoose.model("StripeCustomer", stripeCustomerSchema);
