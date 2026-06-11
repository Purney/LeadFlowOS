export const leadStatuses = [
  "new",
  "imported",
  "contacted",
  "replied",
  "qualified",
  "discovery_sent",
  "proposal_sent",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export type LeadListFilters = {
  search?: string;
  status?: LeadStatus | "all";
  tag?: string;
};
