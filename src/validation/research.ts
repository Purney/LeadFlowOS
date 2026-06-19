import { z } from "zod";
import { researchPriorities, researchStatuses } from "@/types/research";

const stringList = z
  .array(z.string().trim().max(240))
  .default([])
  .transform((items) => items.filter(Boolean));

export const clientResearchInputSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required.").max(160),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  companySize: z.string().trim().max(80).optional().or(z.literal("")),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  decisionMakerName: z.string().trim().max(160).optional().or(z.literal("")),
  decisionMakerRole: z.string().trim().max(160).optional().or(z.literal("")),
  decisionMakerEmail: z.string().email().optional().or(z.literal("")),
  source: z.string().trim().max(120).optional().or(z.literal("")),
  currentProvider: z.string().trim().max(160).optional().or(z.literal("")),
  competitors: stringList,
  painHypotheses: stringList,
  opportunityIdeas: stringList,
  positiveSignals: stringList,
  negativeSignals: stringList,
  fitScore: z.coerce.number().min(0).max(100).default(50),
  priority: z.enum(researchPriorities).default("medium"),
  status: z.enum(researchStatuses).default("draft"),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  opportunityAngle: z.string().trim().max(1000).optional().or(z.literal("")),
  nextAction: z.string().trim().max(240).optional().or(z.literal("")),
});

export const clientResearchUpdateSchema = clientResearchInputSchema.partial();

export const researchChecklistUpdateSchema = z.object({
  itemId: z.string().min(1),
  completed: z.boolean(),
});

export const researchSummaryInputSchema = z.object({
  researchId: z.string().min(1),
});

export type ClientResearchInput = z.infer<typeof clientResearchInputSchema>;
export type ClientResearchUpdateInput = z.infer<
  typeof clientResearchUpdateSchema
>;
export type ResearchChecklistUpdateInput = z.infer<
  typeof researchChecklistUpdateSchema
>;
export type ResearchSummaryInput = z.infer<typeof researchSummaryInputSchema>;
