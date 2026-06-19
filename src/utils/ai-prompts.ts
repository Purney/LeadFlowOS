type LeadPromptData = {
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  website?: string;
  role?: string;
  notes?: string;
  source?: string;
  customFields?: Record<string, unknown>;
};

function leadBlock(lead: LeadPromptData) {
  const customFields = Object.entries(lead.customFields ?? {})
    .map(([key, value]) => `${key}: ${String(value ?? "")}`)
    .join("\n");

  return [
    `Name: ${[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unknown"}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company ?? "Unknown"}`,
    `Website: ${lead.website ?? "Unknown"}`,
    `Role: ${lead.role ?? "Unknown"}`,
    `Source: ${lead.source ?? "Unknown"}`,
    `Notes: ${lead.notes ?? "None"}`,
    customFields ? `Custom fields:\n${customFields}` : "Custom fields: None",
  ].join("\n");
}

export function buildDiscoverySummaryPrompt(input: {
  formName: string;
  lead?: LeadPromptData;
  answers: { label: string; answer: unknown }[];
}) {
  const answers = input.answers
    .map((answer) => `${answer.label}: ${Array.isArray(answer.answer) ? answer.answer.join(", ") : String(answer.answer ?? "")}`)
    .join("\n");

  return [
    "Summarise a client discovery form response for a freelance software engineering, AI, and automation business.",
    "Return JSON only with keys: objectives, painPoints, risks, opportunities, recommendedScope. Each value must be an array of concise strings.",
    "",
    `Form: ${input.formName}`,
    input.lead ? `Lead:\n${leadBlock(input.lead)}` : "Lead: Unknown",
    "",
    "Responses:",
    answers || "No answers submitted.",
  ].join("\n");
}

export function buildProposalDraftPrompt(input: {
  title: string;
  lead?: LeadPromptData;
  answers: { label: string; answer: unknown }[];
}) {
  const answers = input.answers
    .map((answer) => `${answer.label}: ${Array.isArray(answer.answer) ? answer.answer.join(", ") : String(answer.answer ?? "")}`)
    .join("\n");

  return [
    "Draft an editable client proposal for a freelance software engineering, AI, and automation business.",
    "Return JSON only with keys: executiveSummary, identifiedProblem, proposedSolution, deliverables, assumptions, estimatedTimeline, optionalEnhancements.",
    "deliverables, assumptions, and optionalEnhancements must be arrays of concise strings.",
    "Keep claims grounded in the discovery answers. Do not include pricing or legal terms.",
    "",
    `Proposal title: ${input.title}`,
    input.lead ? `Lead:\n${leadBlock(input.lead)}` : "Lead: Unknown",
    "",
    "Discovery answers:",
    answers || "No answers submitted.",
  ].join("\n");
}

export function buildResearchSummaryPrompt(input: {
  companyName: string;
  website?: string;
  industry?: string;
  companySize?: string;
  region?: string;
  decisionMakerName?: string;
  decisionMakerRole?: string;
  currentProvider?: string;
  competitors: string[];
  painHypotheses: string[];
  opportunityIdeas: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  notes?: string;
  opportunityAngle?: string;
  fitScore: number;
}) {
  return [
    "Summarise client research for a freelance software engineering, AI, and automation business.",
    "Return JSON only with keys: fitSummary (string), likelyPainPoints (array), opportunityAngles (array), risks (array), recommendedNextSteps (array).",
    "Use only the supplied research notes. Do not invent revenue, headcount, technologies, or relationships.",
    "",
    `Company: ${input.companyName}`,
    `Website: ${input.website ?? "Unknown"}`,
    `Industry: ${input.industry ?? "Unknown"}`,
    `Company size: ${input.companySize ?? "Unknown"}`,
    `Region: ${input.region ?? "Unknown"}`,
    `Decision maker: ${[input.decisionMakerName, input.decisionMakerRole].filter(Boolean).join(", ") || "Unknown"}`,
    `Current provider: ${input.currentProvider ?? "Unknown"}`,
    `Competitors: ${input.competitors.join(", ") || "Unknown"}`,
    `Fit score: ${input.fitScore}/100`,
    "",
    `Positive signals: ${input.positiveSignals.join("; ") || "None"}`,
    `Negative signals: ${input.negativeSignals.join("; ") || "None"}`,
    `Pain hypotheses: ${input.painHypotheses.join("; ") || "None"}`,
    `Opportunity ideas: ${input.opportunityIdeas.join("; ") || "None"}`,
    `Opportunity angle: ${input.opportunityAngle ?? "None"}`,
    `Notes: ${input.notes ?? "None"}`,
  ].join("\n");
}

export function parseJsonObject<T>(value: string, fallback: T): T {
  try {
    const match = value.match(/\{[\s\S]*\}/);
    return JSON.parse(match?.[0] ?? value) as T;
  } catch {
    return fallback;
  }
}
