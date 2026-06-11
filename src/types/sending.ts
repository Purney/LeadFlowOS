export const emailProviders = ["sendgrid", "smtp", "other"] as const;

export const verificationStatuses = [
  "pending",
  "verified",
  "failed",
  "not_configured",
] as const;

export const warmupStatuses = ["not_started", "warming", "ready", "paused"] as const;

export const sendBatchStatuses = [
  "pending_approval",
  "approved",
  "rejected",
  "sending",
  "sent",
  "failed",
] as const;

export const suppressionReasons = [
  "unsubscribed",
  "bounced",
  "spam_report",
  "manual_suppression",
  "existing_client",
  "competitor",
] as const;

export const emailMessageDirections = ["outbound", "inbound"] as const;

export const emailMessageStatuses = [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "spam_report",
  "unsubscribed",
  "replied",
  "failed",
] as const;

export type EmailProvider = (typeof emailProviders)[number];
export type VerificationStatus = (typeof verificationStatuses)[number];
export type WarmupStatus = (typeof warmupStatuses)[number];
export type SendBatchStatus = (typeof sendBatchStatuses)[number];
export type SuppressionReason = (typeof suppressionReasons)[number];
export type EmailMessageDirection = (typeof emailMessageDirections)[number];
export type EmailMessageStatus = (typeof emailMessageStatuses)[number];

export type EmailHealth = {
  spfConfigured: boolean;
  dkimConfigured: boolean;
  dmarcConfigured: boolean;
  trackingDomainConfigured: boolean;
  unsubscribeSupported: boolean;
  bounceRate: number;
  spamComplaintRate: number;
};
