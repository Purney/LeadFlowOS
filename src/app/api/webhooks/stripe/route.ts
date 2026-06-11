import { NextResponse } from "next/server";
import { processStripeEvent } from "@/services/revenue-service";
import { constructStripeWebhookEvent } from "@/services/stripe-service";

export async function POST(request: Request) {
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
  } catch {
    return NextResponse.json(
      { error: "Stripe webhook verification failed." },
      { status: 400 },
    );
  }
}
