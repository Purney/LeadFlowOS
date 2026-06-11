type LeadPromptData = {
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  website?: string;
  role?: string;
  notes?: string;
  source?: string;
};

type MessagePromptData = {
  direction: "inbound" | "outbound";
  subject: string;
  body: string;
  createdAt?: Date;
};

function leadBlock(lead: LeadPromptData) {
  return [
    `Name: ${[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unknown"}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company ?? "Unknown"}`,
    `Website: ${lead.website ?? "Unknown"}`,
    `Role: ${lead.role ?? "Unknown"}`,
    `Source: ${lead.source ?? "Unknown"}`,
    `Notes: ${lead.notes ?? "None"}`,
  ].join("\n");
}

export function buildColdEmailPrompt(input: {
  lead: LeadPromptData;
  serviceOffer: string;
  campaignGoal: string;
}) {
  return [
    "Generate concise B2B cold email copy for a freelance software engineering, AI, and automation business.",
    "Return JSON only with keys: subjects (array of 3 strings), body (string), followUps (array of 2 strings).",
    "Keep the body under 130 words, specific to the lead, low hype, and suitable for manual review.",
    "Do not claim prior contact or invented facts.",
    "",
    "Lead:",
    leadBlock(input.lead),
    "",
    `Service offered: ${input.serviceOffer}`,
    `Campaign goal: ${input.campaignGoal}`,
  ].join("\n");
}

export function buildReplyDraftPrompt(input: {
  lead: LeadPromptData;
  messages: MessagePromptData[];
}) {
  const conversation = input.messages
    .map(
      (message) =>
        `[${message.direction}] ${message.subject}\n${message.body}`,
    )
    .join("\n\n");

  return [
    "Draft a manual reply for a freelance software engineering, AI, and automation business.",
    "Return JSON only with keys: summary (string), suggestedResponse (string).",
    "The response must be helpful, specific, concise, and must not promise unavailable dates or pricing.",
    "",
    "Lead:",
    leadBlock(input.lead),
    "",
    "Conversation:",
    conversation || "No conversation history found.",
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

export function parseJsonObject<T>(value: string, fallback: T): T {
  try {
    const match = value.match(/\{[\s\S]*\}/);
    return JSON.parse(match?.[0] ?? value) as T;
  } catch {
    return fallback;
  }
}
