export const stripeInvoiceStatuses = [
  "draft",
  "open",
  "paid",
  "uncollectible",
  "void",
  "unknown",
] as const;

export const paymentIntentStatuses = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
  "requires_capture",
  "canceled",
  "succeeded",
  "unknown",
] as const;

export type StripeInvoiceStatus = (typeof stripeInvoiceStatuses)[number];
export type PaymentIntentStatus = (typeof paymentIntentStatuses)[number];

export type RevenuePoint = {
  month: string;
  amount: number;
};
