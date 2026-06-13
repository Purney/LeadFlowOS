export const maintenancePlanStatuses = ["active", "paused", "ended"] as const;
export type MaintenancePlanStatus = (typeof maintenancePlanStatuses)[number];

export const maintenanceCadences = ["monthly", "quarterly", "annual"] as const;
export type MaintenanceCadence = (typeof maintenanceCadences)[number];

export const supportTicketPriorities = ["low", "medium", "high", "urgent"] as const;
export type SupportTicketPriority = (typeof supportTicketPriorities)[number];

export const supportTicketStatuses = ["open", "in_progress", "waiting_on_client", "resolved", "closed"] as const;
export type SupportTicketStatus = (typeof supportTicketStatuses)[number];

export const maintenanceTaskStatuses = ["scheduled", "in_progress", "completed", "skipped"] as const;
export type MaintenanceTaskStatus = (typeof maintenanceTaskStatuses)[number];

export const clientHealthStatuses = ["healthy", "watch", "at_risk"] as const;
export type ClientHealthStatus = (typeof clientHealthStatuses)[number];
