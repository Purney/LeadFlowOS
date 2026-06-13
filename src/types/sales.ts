export const dealStages = [
  "discovery_booked",
  "discovery_complete",
  "proposal_drafted",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export type DealStage = (typeof dealStages)[number];

export const dealStatuses = ["active", "won", "lost", "archived"] as const;

export type DealStatus = (typeof dealStatuses)[number];

export const salesTaskStatuses = ["open", "completed", "cancelled"] as const;

export type SalesTaskStatus = (typeof salesTaskStatuses)[number];

export const dealStageLabels: Record<DealStage, string> = {
  discovery_booked: "Discovery Booked",
  discovery_complete: "Discovery Complete",
  proposal_drafted: "Proposal Drafted",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export function dealStatusForStage(stage: DealStage): DealStatus {
  if (stage === "won") return "won";
  if (stage === "lost") return "lost";
  return "active";
}
