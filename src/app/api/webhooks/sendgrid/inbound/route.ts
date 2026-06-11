import { NextResponse } from "next/server";
import { processInboundReply } from "@/services/email-service";
import { requireSendGridWebhookSecret } from "@/services/sendgrid-service";

export async function POST(request: Request) {
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
}
