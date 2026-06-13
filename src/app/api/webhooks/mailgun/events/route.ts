import { NextResponse } from "next/server";
import { checkPersistentRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { createActivity } from "@/services/activity-service";
import { processMailgunEvents } from "@/services/email-service";
import { verifyMailgunSignature } from "@/services/mailgun-service";

function getOrganisationId(body: Record<string, unknown>, request: Request) {
  const eventData = body["event-data"] as
    | { "user-variables"?: { organisationId?: string } }
    | undefined;

  return (
    eventData?.["user-variables"]?.organisationId ??
    request.headers.get("x-leadflow-organisation-id")
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const signature = body.signature as
    | { timestamp?: string; token?: string; signature?: string }
    | undefined;

  if (!verifyMailgunSignature(signature ?? {})) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const organisationId = getOrganisationId(body, request);

  if (!organisationId) {
    return NextResponse.json(
      { error: "Missing organisation identifier." },
      { status: 400 },
    );
  }

  const rateLimit = await checkPersistentRateLimit(rateLimitKey(request, "mailgun-events"), {
    limit: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const result = await processMailgunEvents(organisationId, [body]);

    return NextResponse.json(result);
  } catch (error) {
    await createActivity({
      organisationId,
      entityType: "webhook",
      action: "webhook.failed",
      metadata: { provider: "mailgun", error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
