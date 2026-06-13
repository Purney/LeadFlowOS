import { NextResponse } from "next/server";
import { checkPersistentRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { createActivity } from "@/services/activity-service";
import { processInboundReply } from "@/services/email-service";
import { verifyMailgunSignature } from "@/services/mailgun-service";

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  const organisationId = request.headers.get("x-leadflow-organisation-id");

  if (!organisationId) {
    return NextResponse.json(
      { error: "Missing organisation header." },
      { status: 400 },
    );
  }

  const rateLimit = await checkPersistentRateLimit(rateLimitKey(request, "mailgun-inbound"), {
    limit: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const form = await request.formData();
    const signature = {
      timestamp: formValue(form, "timestamp"),
      token: formValue(form, "token"),
      signature: formValue(form, "signature"),
    };

    if (!verifyMailgunSignature(signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 },
      );
    }

    const payload = Object.fromEntries(form.entries());
    const result = await processInboundReply(organisationId, {
      from: formValue(form, "sender") ?? formValue(form, "from") ?? "",
      to: formValue(form, "recipient") ?? formValue(form, "to") ?? "",
      subject: formValue(form, "subject") ?? "",
      text: formValue(form, "body-plain"),
      html: formValue(form, "body-html"),
      raw: payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    await createActivity({
      organisationId,
      entityType: "webhook",
      action: "webhook.failed",
      metadata: { provider: "mailgun-inbound", error: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
