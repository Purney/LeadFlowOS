import { z } from "zod";

export const stripeWebhookProcessSchema = z.object({
  organisationId: z.string().min(1),
  event: z.object({
    id: z.string().optional(),
    type: z.string().min(1),
    data: z.object({
      object: z.record(z.string(), z.unknown()),
    }),
  }),
});

export type StripeWebhookProcessInput = z.infer<typeof stripeWebhookProcessSchema>;
