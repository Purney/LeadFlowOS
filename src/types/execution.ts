export const projectHealthStatuses = ["on_track", "at_risk", "blocked"] as const;
export type ProjectHealthStatus = (typeof projectHealthStatuses)[number];

export const milestoneStatuses = [
  "planned",
  "in_progress",
  "completed",
  "blocked",
] as const;
export type MilestoneStatus = (typeof milestoneStatuses)[number];

export const executionTaskStatuses = [
  "todo",
  "in_progress",
  "blocked",
  "completed",
] as const;
export type ExecutionTaskStatus = (typeof executionTaskStatuses)[number];

export const deliverableStatuses = [
  "draft",
  "in_review",
  "approved",
  "delivered",
] as const;
export type DeliverableStatus = (typeof deliverableStatuses)[number];
