import { z } from "zod";
import { leadStatuses } from "@/types/lead";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const reservedCustomFieldKeys = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "organisationId",
  "createdByUserId",
  "passwordHash",
]);

const customFieldsSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .default({})
  .transform((fields) => {
    const entries = Object.entries(fields)
      .map(([key, value]) => [key.trim(), String(value).trim()] as const)
      .filter(([key, value]) => {
        if (!key || !value) return false;
        if (key.length > 64 || value.length > 1000) return false;
        if (reservedCustomFieldKeys.has(key)) return false;
        return /^[A-Za-z][A-Za-z0-9_ -]*$/.test(key);
      })
      .slice(0, 50);

    return Object.fromEntries(entries);
  });

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
  status: leadStatusSchema.default("discovery_booked"),
  customFields: customFieldsSchema,
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
