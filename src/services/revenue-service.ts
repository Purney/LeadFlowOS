import mongoose from "mongoose";
import type Stripe from "stripe";
import { connectToDatabase } from "@/lib/db";
import { StripeCheckoutSession } from "@/models/stripe-checkout-session";
import { StripeCustomer } from "@/models/stripe-customer";
import { StripeInvoice } from "@/models/stripe-invoice";
import { StripePaymentIntent } from "@/models/stripe-payment-intent";
import { createActivity } from "@/services/activity-service";

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function fromUnix(value?: number | null) {
  return value ? new Date(value * 1000) : undefined;
}

function customerId(value: unknown) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in value) return String(value.id);
  return undefined;
}

function currency(value?: string | null) {
  return (value ?? "usd").toLowerCase();
}

export async function upsertStripeCustomer(
  organisationId: string,
  customer: Stripe.Customer,
) {
  await connectToDatabase();

  return StripeCustomer.findOneAndUpdate(
    {
      organisationId: toObjectId(organisationId),
      stripeCustomerId: customer.id,
    },
    {
      $set: {
        organisationId: toObjectId(organisationId),
        stripeCustomerId: customer.id,
        email: customer.email ?? undefined,
        name: customer.name ?? undefined,
        currency: currency(customer.currency),
        raw: customer,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
}

export async function upsertStripeInvoice(
  organisationId: string,
  invoice: Stripe.Invoice,
) {
  await connectToDatabase();

  const doc = await StripeInvoice.findOneAndUpdate(
    {
      organisationId: toObjectId(organisationId),
      stripeInvoiceId: invoice.id,
    },
    {
      $set: {
        organisationId: toObjectId(organisationId),
        stripeCustomerId: customerId(invoice.customer),
        stripeInvoiceId: invoice.id,
        number: invoice.number ?? undefined,
        status: invoice.status ?? "unknown",
        currency: currency(invoice.currency),
        amountDue: invoice.amount_due ?? 0,
        amountPaid: invoice.amount_paid ?? 0,
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
        invoicePdf: invoice.invoice_pdf ?? undefined,
        periodStart: fromUnix(invoice.period_start),
        periodEnd: fromUnix(invoice.period_end),
        paidAt: invoice.status === "paid" ? new Date() : undefined,
        raw: invoice,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  if (invoice.status === "paid") {
    await createActivity({
      organisationId,
      entityType: "stripe_invoice",
      entityId: doc._id.toString(),
      action: "payment.received",
      metadata: { amountPaid: doc.amountPaid, currency: doc.currency },
    });
  }

  return doc;
}

export async function upsertStripeCheckoutSession(
  organisationId: string,
  session: Stripe.Checkout.Session,
) {
  await connectToDatabase();

  return StripeCheckoutSession.findOneAndUpdate(
    {
      organisationId: toObjectId(organisationId),
      stripeSessionId: session.id,
    },
    {
      $set: {
        organisationId: toObjectId(organisationId),
        stripeSessionId: session.id,
        stripeCustomerId: customerId(session.customer),
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
        status: session.status ?? undefined,
        paymentStatus: session.payment_status ?? undefined,
        currency: currency(session.currency),
        amountTotal: session.amount_total ?? 0,
        raw: session,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
}

export async function upsertStripePaymentIntent(
  organisationId: string,
  paymentIntent: Stripe.PaymentIntent,
) {
  await connectToDatabase();

  return StripePaymentIntent.findOneAndUpdate(
    {
      organisationId: toObjectId(organisationId),
      stripePaymentIntentId: paymentIntent.id,
    },
    {
      $set: {
        organisationId: toObjectId(organisationId),
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customerId(paymentIntent.customer),
        status: paymentIntent.status ?? "unknown",
        currency: currency(paymentIntent.currency),
        amount: paymentIntent.amount ?? 0,
        amountReceived: paymentIntent.amount_received ?? 0,
        raw: paymentIntent,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
}

export async function processStripeEvent(
  organisationId: string,
  event: Stripe.Event,
) {
  const object = event.data.object;

  switch (event.type) {
    case "customer.created":
      return upsertStripeCustomer(organisationId, object as Stripe.Customer);
    case "invoice.created":
    case "invoice.paid":
    case "invoice.payment_failed":
      return upsertStripeInvoice(organisationId, object as Stripe.Invoice);
    case "checkout.session.completed":
      return upsertStripeCheckoutSession(
        organisationId,
        object as Stripe.Checkout.Session,
      );
    case "payment_intent.succeeded":
      return upsertStripePaymentIntent(
        organisationId,
        object as Stripe.PaymentIntent,
      );
    default:
      return null;
  }
}

export async function getRevenueMetrics(organisationId: string) {
  await connectToDatabase();

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const orgId = toObjectId(organisationId);
  const [summary, monthly, byCustomer, trend] = await Promise.all([
    StripeInvoice.aggregate([
      { $match: { organisationId: orgId } },
      {
        $group: {
          _id: null,
          paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
          unpaidCount: { $sum: { $cond: [{ $ne: ["$status", "paid"] }, 1, 0] } },
          lifetimeValue: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amountPaid", 0] },
          },
        },
      },
    ]),
    StripeInvoice.aggregate([
      {
        $match: {
          organisationId: orgId,
          status: "paid",
          paidAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, amount: { $sum: "$amountPaid" } } },
    ]),
    StripeInvoice.aggregate([
      { $match: { organisationId: orgId, status: "paid" } },
      {
        $group: {
          _id: { $ifNull: ["$stripeCustomerId", "unknown"] },
          amount: { $sum: "$amountPaid" },
        },
      },
    ]),
    StripeInvoice.aggregate([
      { $match: { organisationId: orgId, status: "paid" } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: { $ifNull: ["$paidAt", "$updatedAt"] },
            },
          },
          amount: { $sum: "$amountPaid" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const totals = summary[0] ?? { paidCount: 0, unpaidCount: 0, lifetimeValue: 0 };
  const monthlyRevenue = monthly[0]?.amount ?? 0;

  return {
    monthlyRevenue,
    lifetimeValue: totals.lifetimeValue,
    paidCount: totals.paidCount,
    unpaidCount: totals.unpaidCount,
    paidVsUnpaid: { paid: totals.paidCount, unpaid: totals.unpaidCount },
    revenueByCustomer: byCustomer.map((item) => ({
      customer: item._id,
      amount: item.amount,
    })),
    revenueTrend: trend.map((item) => ({ month: item._id, amount: item.amount })),
  };
}

export async function listStripeInvoices(organisationId: string) {
  await connectToDatabase();

  return StripeInvoice.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}
