export const projectTypes = [
  "software",
  "ai",
  "automation",
  "consulting",
  "maintenance",
] as const;

export const projectStatuses = [
  "planned",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

export type ProjectType = (typeof projectTypes)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
