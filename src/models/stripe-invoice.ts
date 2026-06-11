import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { stripeInvoiceStatuses } from "@/types/revenue";

const stripeInvoiceSchema = new Schema(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true,
    },
    stripeCustomerId: { type: String, trim: true, index: true },
    stripeInvoiceId: { type: String, required: true, trim: true, index: true },
    number: { type: String, trim: true },
    status: {
      type: String,
      enum: stripeInvoiceStatuses,
      required: true,
      default: "unknown",
      index: true,
    },
    currency: { type: String, lowercase: true, trim: true, default: "usd" },
    amountDue: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, required: true, default: 0 },
    hostedInvoiceUrl: { type: String, trim: true },
    invoicePdf: { type: String, trim: true },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    paidAt: { type: Date, index: true },
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

stripeInvoiceSchema.index(
  { organisationId: 1, stripeInvoiceId: 1 },
  { unique: true },
);

export type StripeInvoiceDocument = InferSchemaType<typeof stripeInvoiceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StripeInvoice =
  mongoose.models.StripeInvoice ||
  mongoose.model("StripeInvoice", stripeInvoiceSchema);
