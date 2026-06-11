import { z } from "zod";
import { leadStatuses } from "@/types/lead";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const leadStatusSchema = z.enum(leadStatuses);

export const leadInputSchema = z.object({
  firstName: optionalText,
  lastName: optionalText,
  email: z.string().trim().email().toLowerCase(),
  phone: optionalText,
  company: optionalText,
  website: optionalText,
  role: optionalText,
  tags: z.array(z.string().trim().min(1)).default([]),
  notes: optionalText,
  source: optionalText,
  status: leadStatusSchema.default("new"),
  customFields: z.record(z.string(), z.unknown()).default({}),
});

export const leadUpdateSchema = leadInputSchema.partial().extend({
  status: leadStatusSchema.optional(),
});

export const leadImportSchema = z.object({
  csv: z.string().min(1, "Paste CSV content to import."),
  source: optionalText,
});

export const leadQuerySchema = z.object({
  search: optionalText,
  status: z.union([leadStatusSchema, z.literal("all")]).default("all"),
  tag: optionalText,
});

export type LeadInput = z.infer<typeof leadInputSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type LeadImportInput = z.infer<typeof leadImportSchema>;
