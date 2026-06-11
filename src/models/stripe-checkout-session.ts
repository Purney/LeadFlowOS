import mongoose, { type InferSchemaType, Schema } from "mongoose";

const stripeCheckoutSessionSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    stripeSessionId: { type: String, required: true, trim: true, index: true },
    stripeCustomerId: { type: String, trim: true, index: true },
    paymentIntentId: { type: String, trim: true, index: true },
    status: { type: String, trim: true },
    paymentStatus: { type: String, trim: true },
    currency: { type: String, lowercase: true, trim: true },
    amountTotal: { type: Number, default: 0 },
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

stripeCheckoutSessionSchema.index(
  { organisationId: 1, stripeSessionId: 1 },
  { unique: true },
);

export type StripeCheckoutSessionDocument = InferSchemaType<
  typeof stripeCheckoutSessionSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const StripeCheckoutSession =
  mongoose.models.StripeCheckoutSession ||
  mongoose.model("StripeCheckoutSession", stripeCheckoutSessionSchema);
