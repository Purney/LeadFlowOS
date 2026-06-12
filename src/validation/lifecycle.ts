import { z } from "zod";
import { lifecycleStages, lifecycleStatuses } from "@/types/lifecycle";

const optionalDate = z.coerce.date().optional().nullable();

export const lifecycleAccountInputSchema = z.object({
  name: z.string().min(1, "Account name is required.").max(160),
  primaryEmail: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  source: z.string().max(120).optional().or(z.literal("")),
  stage: z.enum(lifecycleStages).default("client_research"),
  status: z.enum(lifecycleStatuses).default("active"),
  fitScore: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional().or(z.literal("")),
  nextAction: z.string().max(240).optional().or(z.literal("")),
  nextActionDueAt: optionalDate,
  tags: z.array(z.string().max(64)).default([]),
});

export const lifecycleAccountUpdateSchema = lifecycleAccountInputSchema
  .partial()
  .extend({
    leadId: z.string().optional(),
    clientId: z.string().optional(),
    proposalId: z.string().optional(),
    stripeCustomerId: z.string().optional().or(z.literal("")),
  });

export const lifecycleStageUpdateSchema = z.object({
  stage: z.enum(lifecycleStages),
  status: z.enum(lifecycleStatuses).optional(),
  nextAction: z.string().max(240).optional().or(z.literal("")),
  nextActionDueAt: optionalDate,
  note: z.string().max(1000).optional().or(z.literal("")),
});

export const lifecycleQuerySchema = z.object({
  stage: z.enum(lifecycleStages).or(z.literal("all")).default("all"),
  status: z.enum(lifecycleStatuses).or(z.literal("all")).default("all"),
  search: z.string().max(120).optional(),
});

export type LifecycleAccountInput = z.infer<typeof lifecycleAccountInputSchema>;
export type LifecycleAccountUpdateInput = z.infer<
  typeof lifecycleAccountUpdateSchema
>;
export type LifecycleStageUpdateInput = z.infer<
  typeof lifecycleStageUpdateSchema
>;
export type LifecycleQueryInput = z.infer<typeof lifecycleQuerySchema>;
