import { z } from "zod";
import { discoveryFieldTypes, discoveryFormStatuses } from "@/types/discovery";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const discoveryFieldSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(2),
  type: z.enum(discoveryFieldTypes),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1)).default([]),
});

export const discoveryFormInputSchema = z.object({
  name: z.string().trim().min(2),
  description: optionalText,
  status: z.enum(discoveryFormStatuses).default("draft"),
  fields: z.array(discoveryFieldSchema).min(1),
});

export const discoveryFormUpdateSchema = discoveryFormInputSchema.partial();

export const discoveryResponseInputSchema = z.object({
  leadId: z.string().optional(),
  respondentEmail: z.string().trim().email().toLowerCase().optional(),
  respondentName: optionalText,
  answers: z.record(z.string(), z.unknown()),
});

export const discoverySummaryInputSchema = z.object({
  responseId: z.string().min(1),
});

export type DiscoveryFormInput = z.infer<typeof discoveryFormInputSchema>;
export type DiscoveryFormUpdateInput = z.infer<typeof discoveryFormUpdateSchema>;
export type DiscoveryResponseInput = z.infer<typeof discoveryResponseInputSchema>;
export type DiscoverySummaryInput = z.infer<typeof discoverySummaryInputSchema>;
