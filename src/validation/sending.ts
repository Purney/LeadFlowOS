import { z } from "zod";
import {
  dmarcPolicies,
  emailProviders,
  reputationStatuses,
  sendBatchStatuses,
  verificationStatuses,
  warmupStatuses,
} from "@/types/sending";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const emailHealthSchema = z.object({
  spfConfigured: z.boolean().default(false),
  dkimConfigured: z.boolean().default(false),
  dmarcConfigured: z.boolean().default(false),
  dmarcPolicy: z.enum(dmarcPolicies).default("none"),
  forwardReverseDnsConfigured: z.boolean().default(false),
  tlsEnabled: z.boolean().default(false),
  trackingDomainConfigured: z.boolean().default(false),
  unsubscribeSupported: z.boolean().default(true),
  oneClickUnsubscribeSupported: z.boolean().default(false),
  blocklistDetected: z.boolean().default(false),
  bounceRate: z.coerce.number().min(0).max(1).default(0),
  spamComplaintRate: z.coerce.number().min(0).max(1).default(0),
  deferralRate: z.coerce.number().min(0).max(1).default(0),
});

export const emailAccountInputSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  domain: z.string().trim().min(2),
  provider: z.enum(emailProviders).default("mailgun"),
  mailgunDomain: optionalText,
  verificationStatus: z.enum(verificationStatuses).default("not_configured"),
  dailySendLimit: z.coerce.number().int().min(1).max(5000).default(25),
  perDomainDailyLimit: z.coerce.number().int().min(1).max(500).default(5),
  warmupTargetDailyVolume: z.coerce.number().int().min(1).max(5000).default(75),
  warmupStatus: z.enum(warmupStatuses).default("not_started"),
  warmupStartedAt: z.coerce.date().optional(),
  reputationStatus: z.enum(reputationStatuses).default("unknown"),
  lastDeliverabilityReviewAt: z.coerce.date().optional(),
  active: z.boolean().default(true),
  health: emailHealthSchema.default({
    spfConfigured: false,
    dkimConfigured: false,
    dmarcConfigured: false,
    dmarcPolicy: "none",
    forwardReverseDnsConfigured: false,
    tlsEnabled: false,
    trackingDomainConfigured: false,
    unsubscribeSupported: true,
    oneClickUnsubscribeSupported: false,
    blocklistDetected: false,
    bounceRate: 0,
    spamComplaintRate: 0,
    deferralRate: 0,
  }),
});

export const emailAccountUpdateSchema = emailAccountInputSchema.partial();

export const generateSendBatchSchema = z.object({
  campaignId: z.string().min(1),
  sendingAccountId: z.string().min(1),
  scheduledSendTime: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(250).default(25),
});

export const sendBatchUpdateSchema = z.object({
  status: z.enum(sendBatchStatuses).optional(),
  scheduledSendTime: z.coerce.date().optional(),
  subject: optionalText,
  body: optionalText,
  rejectionReason: optionalText,
});

export type EmailAccountInput = z.infer<typeof emailAccountInputSchema>;
export type EmailAccountUpdateInput = z.infer<typeof emailAccountUpdateSchema>;
export type GenerateSendBatchInput = z.infer<typeof generateSendBatchSchema>;
export type SendBatchUpdateInput = z.infer<typeof sendBatchUpdateSchema>;
