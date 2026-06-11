import { z } from "zod";
import { campaignStatuses } from "@/types/campaign";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const variantListSchema = z
  .array(z.string().trim().min(1))
  .min(1, "Add at least one variant.");

export const campaignStepInputSchema = z.object({
  name: z.string().trim().min(2, "Step name is required."),
  delayDays: z.coerce.number().int().min(0).max(90).default(0),
  subjectVariants: variantListSchema,
  bodyVariants: variantListSchema,
});

export const campaignInputSchema = z.object({
  name: z.string().trim().min(2, "Campaign name is required."),
  goal: optionalText,
  serviceOffer: optionalText,
  status: z.enum(campaignStatuses).default("draft"),
  steps: z.array(campaignStepInputSchema).min(1, "Add at least one stage."),
});

export const campaignUpdateSchema = campaignInputSchema.partial().extend({
  status: z.enum(campaignStatuses).optional(),
});

export const campaignEnrollSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, "Select at least one lead."),
  startAt: z.coerce.date().optional(),
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
export type CampaignEnrollInput = z.infer<typeof campaignEnrollSchema>;
