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
  const invoices = await StripeInvoice.find({
    organisationId: toObjectId(organisationId),
  }).lean();
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const monthlyRevenue = paidInvoices
    .filter((invoice) => invoice.paidAt && invoice.paidAt >= monthStart)
    .reduce((total, invoice) => total + invoice.amountPaid, 0);
  const lifetimeValue = paidInvoices.reduce(
    (total, invoice) => total + invoice.amountPaid,
    0,
  );
  const paidCount = paidInvoices.length;
  const unpaidCount = invoices.filter((invoice) => invoice.status !== "paid").length;
  const byCustomer = new Map<string, number>();
  const trend = new Map<string, number>();

  for (const invoice of paidInvoices) {
    byCustomer.set(
      invoice.stripeCustomerId ?? "unknown",
      (byCustomer.get(invoice.stripeCustomerId ?? "unknown") ?? 0) +
        invoice.amountPaid,
    );

    const paidAt = invoice.paidAt ?? invoice.updatedAt;
    const key = `${paidAt.getUTCFullYear()}-${String(paidAt.getUTCMonth() + 1).padStart(2, "0")}`;
    trend.set(key, (trend.get(key) ?? 0) + invoice.amountPaid);
  }

  return {
    monthlyRevenue,
    lifetimeValue,
    paidCount,
    unpaidCount,
    paidVsUnpaid: { paid: paidCount, unpaid: unpaidCount },
    revenueByCustomer: [...byCustomer.entries()].map(([customer, amount]) => ({
      customer,
      amount,
    })),
    revenueTrend: [...trend.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount })),
  };
}

export async function listStripeInvoices(organisationId: string) {
  await connectToDatabase();

  return StripeInvoice.find({ organisationId: toObjectId(organisationId) })
    .sort({ createdAt: -1 })
    .lean();
}
