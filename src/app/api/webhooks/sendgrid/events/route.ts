import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { createActivity } from "@/services/activity-service";
import { processSendGridEvents } from "@/services/email-service";
import { requireSendGridWebhookSecret } from "@/services/sendgrid-service";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(rateLimitKey(request, "sendgrid-events"), {
    limit: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const secret = request.headers.get("x-leadflow-webhook-secret");

  if (secret !== requireSendGridWebhookSecret()) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const organisationId = request.headers.get("x-leadflow-organisation-id");

  if (!organisationId) {
    return NextResponse.json(
      { error: "Missing organisation header." },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const events = Array.isArray(body) ? body : [body];
    const result = await processSendGridEvents(organisationId, events);

    return NextResponse.json(result);
  } catch (error) {
    await createActivity({
      organisationId,
      entityType: "webhook",
      action: "webhook.failed",
      metadata: { provider: "sendgrid", error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
