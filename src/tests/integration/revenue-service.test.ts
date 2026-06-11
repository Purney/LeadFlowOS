import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { disconnectFromDatabase } from "@/lib/db";
import { ActivityLog } from "@/models/activity-log";
import { Organisation } from "@/models/organisation";
import { StripeCheckoutSession } from "@/models/stripe-checkout-session";
import { StripeCustomer } from "@/models/stripe-customer";
import { StripeInvoice } from "@/models/stripe-invoice";
import { StripePaymentIntent } from "@/models/stripe-payment-intent";
import { User } from "@/models/user";
import { createFirstOwner } from "@/services/auth-service";
import {
  getRevenueMetrics,
  processStripeEvent,
} from "@/services/revenue-service";

let mongo: MongoMemoryServer;
let organisationId: string;

async function bootstrapOwner() {
  const owner = await createFirstOwner({
    ownerName: "Ada Lovelace",
    organisationName: "LeadFlow OS",
    email: "ada@example.com",
    password: "CorrectHorse12",
  });
  organisationId = owner.organisation._id.toString();
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
});

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all([
    ActivityLog.deleteMany({}),
    StripeCheckoutSession.deleteMany({}),
    StripePaymentIntent.deleteMany({}),
    StripeInvoice.deleteMany({}),
    StripeCustomer.deleteMany({}),
    Organisation.deleteMany({}),
    User.deleteMany({}),
  ]);
  process.env.ALLOW_ADDITIONAL_ORG_SIGNUPS = "false";
});

afterAll(async () => {
  await disconnectFromDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

describe("revenue service", () => {
  it("processes Stripe customer, invoice, checkout, and payment events", async () => {
    vi.setSystemTime(new Date("2026-06-11T12:00:00.000Z"));
    await bootstrapOwner();

    await processStripeEvent(organisationId, {
      type: "customer.created",
      data: {
        object: {
          id: "cus_123",
          email: "client@example.com",
          name: "Client Co",
          currency: "usd",
        },
      },
    } as never);
    await processStripeEvent(organisationId, {
      type: "invoice.paid",
      data: {
        object: {
          id: "in_123",
          customer: "cus_123",
          number: "INV-001",
          status: "paid",
          currency: "usd",
          amount_due: 500000,
          amount_paid: 500000,
          period_start: 1_812_844_800,
          period_end: 1_815_436_800,
        },
      },
    } as never);
    await processStripeEvent(organisationId, {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_123",
          customer: "cus_123",
          payment_intent: "pi_123",
          status: "complete",
          payment_status: "paid",
          currency: "usd",
          amount_total: 500000,
        },
      },
    } as never);
    await processStripeEvent(organisationId, {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_123",
          customer: "cus_123",
          status: "succeeded",
          currency: "usd",
          amount: 500000,
          amount_received: 500000,
        },
      },
    } as never);

    await expect(StripeCustomer.countDocuments({})).resolves.toBe(1);
    await expect(StripeInvoice.countDocuments({ status: "paid" })).resolves.toBe(1);
    await expect(StripeCheckoutSession.countDocuments({})).resolves.toBe(1);
    await expect(StripePaymentIntent.countDocuments({ status: "succeeded" })).resolves.toBe(1);
    await expect(ActivityLog.countDocuments({ action: "payment.received" })).resolves.toBe(1);
  });

  it("calculates revenue metrics", async () => {
    vi.setSystemTime(new Date("2026-06-11T12:00:00.000Z"));
    await bootstrapOwner();
    await processStripeEvent(organisationId, {
      type: "invoice.paid",
      data: {
        object: {
          id: "in_paid",
          customer: "cus_123",
          status: "paid",
          currency: "usd",
          amount_due: 200000,
          amount_paid: 200000,
        },
      },
    } as never);
    await processStripeEvent(organisationId, {
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_failed",
          customer: "cus_123",
          status: "open",
          currency: "usd",
          amount_due: 100000,
          amount_paid: 0,
        },
      },
    } as never);

    const metrics = await getRevenueMetrics(organisationId);

    expect(metrics.monthlyRevenue).toBe(200000);
    expect(metrics.lifetimeValue).toBe(200000);
    expect(metrics.paidVsUnpaid).toEqual({ paid: 1, unpaid: 1 });
    expect(metrics.revenueByCustomer).toEqual([
      { customer: "cus_123", amount: 200000 },
    ]);
    expect(metrics.revenueTrend).toHaveLength(1);
  });
});
