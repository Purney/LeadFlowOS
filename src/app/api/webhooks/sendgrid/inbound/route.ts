import { NextResponse } from "next/server";
import { checkPersistentRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { createActivity } from "@/services/activity-service";
import { processInboundReply } from "@/services/email-service";
import { requireSendGridWebhookSecret } from "@/services/sendgrid-service";

export async function POST(request: Request) {
  const rateLimit = await checkPersistentRateLimit(rateLimitKey(request, "sendgrid-inbound"), {
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
    const contentType = request.headers.get("content-type") ?? "";
    let payload: Record<string, unknown>;

    if (contentType.includes("application/json")) {
      payload = (await request.json()) as Record<string, unknown>;
    } else {
      const form = await request.formData();
      payload = Object.fromEntries(form.entries());
    }

    const result = await processInboundReply(organisationId, {
      from: String(payload.from ?? ""),
      to: String(payload.to ?? ""),
      subject: String(payload.subject ?? ""),
      text: payload.text ? String(payload.text) : undefined,
      html: payload.html ? String(payload.html) : undefined,
      raw: payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    await createActivity({
      organisationId,
      entityType: "webhook",
      action: "webhook.failed",
      metadata: { provider: "sendgrid-inbound", error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
