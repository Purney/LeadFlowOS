import { z } from "zod";
import {
  clientHealthStatuses,
  maintenanceCadences,
  maintenancePlanStatuses,
  maintenanceTaskStatuses,
  supportTicketPriorities,
  supportTicketStatuses,
} from "@/types/maintenance";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Expected a Mongo object id.");
const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const optionalDate = z.coerce.date().optional();

export const maintenancePlanInputSchema = z.object({
  clientId: objectId,
  projectId: objectId.optional(),
  name: z.string().trim().min(2).max(160),
  cadence: z.enum(maintenanceCadences).default("monthly"),
  monthlyFeeCents: z.coerce.number().int().min(0).default(0),
  includedHours: z.coerce.number().min(0).default(0),
  status: z.enum(maintenancePlanStatuses).default("active"),
  health: z.enum(clientHealthStatuses).default("healthy"),
  renewalDate: optionalDate,
  nextCheckInDate: optionalDate,
  notes: optionalText,
});

export const supportTicketInputSchema = z.object({
  clientId: objectId,
  projectId: objectId.optional(),
  title: z.string().trim().min(2).max(160),
  description: optionalText,
  priority: z.enum(supportTicketPriorities).default("medium"),
  status: z.enum(supportTicketStatuses).default("open"),
  dueDate: optionalDate,
});

export const maintenanceTaskInputSchema = z.object({
  planId: objectId,
  title: z.string().trim().min(2).max(160),
  description: optionalText,
  dueDate: optionalDate,
  status: z.enum(maintenanceTaskStatuses).default("scheduled"),
});

export type MaintenancePlanInput = z.infer<typeof maintenancePlanInputSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketInputSchema>;
export type MaintenanceTaskInput = z.infer<typeof maintenanceTaskInputSchema>;
