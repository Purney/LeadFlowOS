import { z } from "zod";
import { proposalStatuses } from "@/types/proposal";

const stringList = z.array(z.string().trim().min(1)).default([]);

export const proposalContentSchema = z.object({
  executiveSummary: z.string().trim().min(1),
  identifiedProblem: z.string().trim().min(1),
  proposedSolution: z.string().trim().min(1),
  deliverables: stringList,
  assumptions: stringList,
  estimatedTimeline: z.string().trim().min(1),
  optionalEnhancements: stringList,
});

export const proposalInputSchema = z.object({
  title: z.string().trim().min(2),
  leadId: z.string().optional(),
  discoveryResponseId: z.string().optional(),
  status: z.enum(proposalStatuses).default("draft"),
  content: proposalContentSchema,
});

export const proposalUpdateSchema = proposalInputSchema.partial().extend({
  status: z.enum(proposalStatuses).optional(),
  content: proposalContentSchema.optional(),
});

export const proposalAiDraftSchema = z.object({
  discoveryResponseId: z.string().min(1),
  title: z.string().trim().min(2).optional(),
});

export type ProposalInput = z.infer<typeof proposalInputSchema>;
export type ProposalUpdateInput = z.infer<typeof proposalUpdateSchema>;
export type ProposalAiDraftInput = z.infer<typeof proposalAiDraftSchema>;
