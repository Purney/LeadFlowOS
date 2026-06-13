import crypto from "crypto";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { getEnv, requireEnv } from "@/lib/env";

type MailgunMessage = {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  "v:organisationId"?: string;
  "v:emailMessageId"?: string;
  "v:sendBatchId"?: string;
  "v:leadId"?: string;
};

type MailgunSignature = {
  timestamp?: string;
  token?: string;
  signature?: string;
};

let client: ReturnType<InstanceType<typeof Mailgun>["client"]> | null = null;

export function getMailgunClient() {
  if (!client) {
    const mailgun = new Mailgun(FormData);
    const options: Parameters<typeof mailgun.client>[0] = {
      username: "api",
      key: requireEnv("MAILGUN_API_KEY"),
    };
    const baseUrl = getEnv().MAILGUN_API_BASE_URL;
    if (baseUrl) {
      options.url = baseUrl;
    }
    client = mailgun.client(options);
  }

  return client;
}

export function requireMailgunSigningKey() {
  return requireEnv("MAILGUN_WEBHOOK_SIGNING_KEY");
}

export function verifyMailgunSignature(signature: MailgunSignature) {
  if (!signature.timestamp || !signature.token || !signature.signature) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", requireMailgunSigningKey())
    .update(`${signature.timestamp}${signature.token}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature.signature),
  );
}

export async function sendMailgunMessage(domain: string, message: MailgunMessage) {
  const response = await getMailgunClient().messages.create(domain, message);
  return {
    statusCode: response.status,
    messageId: response.id,
  };
}
