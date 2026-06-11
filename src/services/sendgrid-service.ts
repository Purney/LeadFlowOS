import sgMail from "@sendgrid/mail";
import { requireEnv } from "@/lib/env";
import type { MailDataRequired } from "@sendgrid/mail";

let configured = false;

export function getSendGridClient() {
  if (!configured) {
    sgMail.setApiKey(requireEnv("SENDGRID_API_KEY"));
    configured = true;
  }

  return sgMail;
}

export function requireSendGridWebhookSecret() {
  return requireEnv("SENDGRID_WEBHOOK_SECRET");
}

export async function sendSendGridMessage(message: MailDataRequired) {
  const [response] = await getSendGridClient().send(message);
  return {
    statusCode: response.statusCode,
    messageId: response.headers["x-message-id"] as string | undefined,
  };
}
