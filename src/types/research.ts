export const researchStatuses = [
  "draft",
  "researched",
  "qualified",
  "disqualified",
] as const;

export type ResearchStatus = (typeof researchStatuses)[number];

export const researchPriorities = ["low", "medium", "high"] as const;

export type ResearchPriority = (typeof researchPriorities)[number];

export const defaultResearchChecklist = [
  "Confirm ICP fit",
  "Review website and offer",
  "Identify likely pain points",
  "Find decision maker",
  "Check current provider or competitors",
  "Define outreach angle",
] as const;
