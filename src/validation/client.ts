import { z } from "zod";
import { projectStatuses, projectTypes } from "@/types/client";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const clientContactSchema = z.object({
  name: optionalText,
  email: z.string().trim().email().toLowerCase(),
  role: optionalText,
  phone: optionalText,
});

export const clientInputSchema = z.object({
  company: z.string().trim().min(2),
  contacts: z.array(clientContactSchema).default([]),
  notes: optionalText,
  stripeCustomerId: optionalText,
});

export const convertLeadSchema = z.object({
  leadId: z.string().min(1),
  notes: optionalText,
  stripeCustomerId: optionalText,
});

export const projectInputSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(2),
  type: z.enum(projectTypes),
  status: z.enum(projectStatuses).default("planned"),
  estimatedValue: z.coerce.number().min(0).default(0),
  actualRevenue: z.coerce.number().min(0).default(0),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const projectUpdateSchema = projectInputSchema.partial().extend({
  status: z.enum(projectStatuses).optional(),
});

export const timeEntryInputSchema = z.object({
  projectId: z.string().min(1),
  clientId: z.string().min(1),
  date: z.coerce.date(),
  minutes: z.coerce.number().int().min(1),
  description: z.string().trim().min(1),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type TimeEntryInput = z.infer<typeof timeEntryInputSchema>;
