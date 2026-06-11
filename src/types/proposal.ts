export const proposalStatuses = ["draft", "sent", "accepted", "rejected"] as const;

export type ProposalStatus = (typeof proposalStatuses)[number];

export type ProposalContent = {
  executiveSummary: string;
  identifiedProblem: string;
  proposedSolution: string;
  deliverables: string[];
  assumptions: string[];
  estimatedTimeline: string;
  optionalEnhancements: string[];
};

export type ProposalVersion = {
  version: number;
  content: ProposalContent;
  createdAt: Date;
  createdByUserId?: string;
};
