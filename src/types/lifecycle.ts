export const lifecycleStages = [
  "client_research",
  "proposal_sales",
  "onboarding_payment",
  "solution_execution",
  "maintenance",
] as const;

export type LifecycleStage = (typeof lifecycleStages)[number];

export const lifecycleStatuses = [
  "active",
  "at_risk",
  "blocked",
  "won",
  "lost",
  "archived",
] as const;

export type LifecycleStatus = (typeof lifecycleStatuses)[number];

export const lifecycleStageLabels: Record<LifecycleStage, string> = {
  client_research: "Client Research",
  proposal_sales: "Proposal & Sales",
  onboarding_payment: "Onboarding & Payment",
  solution_execution: "Solution Execution",
  maintenance: "Maintenance",
};

export const lifecycleStageDescriptions: Record<LifecycleStage, string> = {
  client_research: "Research, ICP fit, hypotheses, and target account context.",
  proposal_sales: "Booked calls, discovery, proposal drafting, sales follow-up, and decision tracking.",
  onboarding_payment: "Client conversion, payment, signatures, onboarding tasks, and handoff.",
  solution_execution: "Projects, delivery status, deliverables, time, and client collaboration.",
  maintenance: "Ongoing support, renewals, retainers, check-ins, and expansion opportunities.",
};

export function isLifecycleStage(value: string): value is LifecycleStage {
  return lifecycleStages.includes(value as LifecycleStage);
}

export function getNextLifecycleStage(stage: LifecycleStage) {
  const index = lifecycleStages.indexOf(stage);
  return lifecycleStages[index + 1] ?? null;
}
