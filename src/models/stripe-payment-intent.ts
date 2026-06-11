import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { paymentIntentStatuses } from "@/types/revenue";

const stripePaymentIntentSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    stripeCustomerId: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: paymentIntentStatuses,
      required: true,
      default: "unknown",
      index: true,
    },
    currency: { type: String, lowercase: true, trim: true, default: "usd" },
    amount: { type: Number, required: true, default: 0 },
    amountReceived: { type: Number, required: true, default: 0 },
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

stripePaymentIntentSchema.index(
  { organisationId: 1, stripePaymentIntentId: 1 },
  { unique: true },
);

export type StripePaymentIntentDocument = InferSchemaType<
  typeof stripePaymentIntentSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const StripePaymentIntent =
  mongoose.models.StripePaymentIntent ||
  mongoose.model("StripePaymentIntent", stripePaymentIntentSchema);
