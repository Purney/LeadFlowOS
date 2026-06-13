import { z } from "zod";
import {
  deliverableStatuses,
  executionTaskStatuses,
  milestoneStatuses,
  projectHealthStatuses,
} from "@/types/execution";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Expected a Mongo object id.");
const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const optionalDate = z.coerce.date().optional();

export const projectExecutionUpdateSchema = z.object({
  health: z.enum(projectHealthStatuses).optional(),
  progressPercent: z.coerce.number().min(0).max(100).optional(),
  clientVisibleSummary: optionalText,
  internalStatusNote: optionalText,
});

export const milestoneInputSchema = z.object({
  projectId: objectId,
  title: z.string().trim().min(1).max(160),
  description: optionalText,
  status: z.enum(milestoneStatuses).default("planned"),
  dueDate: optionalDate,
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const executionTaskInputSchema = z.object({
  projectId: objectId,
  milestoneId: objectId.optional(),
  title: z.string().trim().min(1).max(160),
  description: optionalText,
  assigneeName: optionalText,
  status: z.enum(executionTaskStatuses).default("todo"),
  dueDate: optionalDate,
});

export const deliverableInputSchema = z.object({
  projectId: objectId,
  title: z.string().trim().min(1).max(160),
  description: optionalText,
  url: z.string().url().optional().or(z.literal("")),
  status: z.enum(deliverableStatuses).default("draft"),
});

export const executionStatusUpdateSchema = z.object({
  status: z
    .enum([...milestoneStatuses, ...executionTaskStatuses, ...deliverableStatuses])
    .optional(),
});

export type ProjectExecutionUpdateInput = z.infer<typeof projectExecutionUpdateSchema>;
export type MilestoneInput = z.infer<typeof milestoneInputSchema>;
export type ExecutionTaskInput = z.infer<typeof executionTaskInputSchema>;
export type DeliverableInput = z.infer<typeof deliverableInputSchema>;
export type ExecutionStatusUpdateInput = z.infer<typeof executionStatusUpdateSchema>;
