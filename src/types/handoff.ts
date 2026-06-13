export const handoffStatuses = [
  "draft",
  "in_progress",
  "blocked",
  "ready_for_execution",
  "completed",
] as const;

export type HandoffStatus = (typeof handoffStatuses)[number];

export const paymentGateStatuses = [
  "not_required",
  "pending",
  "paid",
  "failed",
] as const;

export type PaymentGateStatus = (typeof paymentGateStatuses)[number];

export const handoffTemplateTypes = [
  "automation",
  "software",
  "ai",
  "consulting",
  "maintenance",
] as const;

export type HandoffTemplateType = (typeof handoffTemplateTypes)[number];
