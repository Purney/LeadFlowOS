export const aiDraftTypes = [
  "discovery_summary",
  "research_summary",
] as const;
export const aiDraftStatuses = ["draft", "reviewed", "discarded"] as const;

export type AiDraftType = (typeof aiDraftTypes)[number];
export type AiDraftStatus = (typeof aiDraftStatuses)[number];

export type DiscoverySummaryContent = {
  objectives: string[];
  painPoints: string[];
  risks: string[];
  opportunities: string[];
  recommendedScope: string[];
};

export type ResearchSummaryContent = {
  fitSummary: string;
  likelyPainPoints: string[];
  opportunityAngles: string[];
  risks: string[];
  recommendedNextSteps: string[];
};
