import { NextResponse } from "next/server";
import { processSendGridEvents } from "@/services/email-service";
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

  const body = await request.json();
  const events = Array.isArray(body) ? body : [body];
  const result = await processSendGridEvents(organisationId, events);

  return NextResponse.json(result);
}
