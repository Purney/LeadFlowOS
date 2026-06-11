import sgMail from "@sendgrid/mail";
import { requireEnv } from "@/lib/env";

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
