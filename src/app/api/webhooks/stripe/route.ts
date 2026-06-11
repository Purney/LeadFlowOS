import { NextResponse } from "next/server";
import { checkPersistentRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { createActivity } from "@/services/activity-service";
import { processStripeEvent } from "@/services/revenue-service";
import { constructStripeWebhookEvent } from "@/services/stripe-service";

export async function POST(request: Request) {
  const rateLimit = await checkPersistentRateLimit(rateLimitKey(request, "stripe-webhook"), {
    limit: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const signature = request.headers.get("stripe-signature");
  const organisationId = request.headers.get("x-leadflow-organisation-id");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  if (!organisationId) {
    return NextResponse.json(
      { error: "Missing organisation header." },
      { status: 400 },
    );
  }

  try {
    const payload = await request.text();
    const event = await constructStripeWebhookEvent(payload, signature);
    await processStripeEvent(organisationId, event);

    return NextResponse.json({ received: true });
  } catch (error) {
    await createActivity({
      organisationId,
      entityType: "webhook",
      action: "webhook.failed",
      metadata: { provider: "stripe", error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json(
      { error: "Stripe webhook verification failed." },
      { status: 400 },
    );
  }
}
