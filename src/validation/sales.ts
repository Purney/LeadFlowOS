import { z } from "zod";
import { dealStages, dealStatuses, salesTaskStatuses } from "@/types/sales";

const optionalDate = z.coerce.date().optional().nullable();

export const dealInputSchema = z.object({
  lifecycleAccountId: z.string().optional(),
  leadId: z.string().optional(),
  proposalId: z.string().optional(),
  title: z.string().trim().min(2).max(180),
  companyName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().max(160).optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  valueCents: z.coerce.number().int().min(0).default(0),
  probability: z.coerce.number().int().min(0).max(100).default(25),
  stage: z.enum(dealStages).default("discovery_booked"),
  status: z.enum(dealStatuses).default("active"),
  expectedCloseDate: optionalDate,
  nextAction: z.string().trim().max(240).optional().or(z.literal("")),
  nextActionDueAt: optionalDate,
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  wonReason: z.string().trim().max(500).optional().or(z.literal("")),
  lostReason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const dealUpdateSchema = dealInputSchema.partial();

export const salesTaskInputSchema = z.object({
  dealId: z.string().min(1),
  title: z.string().trim().min(2).max(240),
  dueAt: optionalDate,
  status: z.enum(salesTaskStatuses).default("open"),
});

export const salesTaskUpdateSchema = z.object({
  status: z.enum(salesTaskStatuses),
});

export type DealInput = z.infer<typeof dealInputSchema>;
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;
export type SalesTaskInput = z.infer<typeof salesTaskInputSchema>;
export type SalesTaskUpdateInput = z.infer<typeof salesTaskUpdateSchema>;
