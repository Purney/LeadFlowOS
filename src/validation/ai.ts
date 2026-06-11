import { z } from "zod";

export const coldEmailGenerationSchema = z.object({
  leadId: z.string().min(1),
  serviceOffer: z.string().trim().min(2),
  campaignGoal: z.string().trim().min(2),
});

export const replyDraftGenerationSchema = z.object({
  leadId: z.string().min(1),
});

export type ColdEmailGenerationInput = z.infer<
  typeof coldEmailGenerationSchema
>;
export type ReplyDraftGenerationInput = z.infer<
  typeof replyDraftGenerationSchema
>;
