import { describe, expect, it } from "vitest";
import {
  buildDiscoverySummaryPrompt,
  buildResearchSummaryPrompt,
  parseJsonObject,
} from "@/utils/ai-prompts";

describe("AI prompts", () => {
  it("builds discovery summary prompts with lead and answer context", () => {
    const prompt = buildDiscoverySummaryPrompt({
      formName: "Discovery",
      lead: { firstName: "Ada", email: "ada@example.com", company: "Analytical Engines" },
      answers: [
        { label: "Goal", answer: "Automate reporting" },
      ],
    });

    expect(prompt).toContain("Analytical Engines");
    expect(prompt).toContain("Automate reporting");
    expect(prompt).toContain("Return JSON only");
  });

  it("builds research summary prompts with opportunity context", () => {
    const prompt = buildResearchSummaryPrompt({
      companyName: "Compiler Labs",
      competitors: [],
      painHypotheses: ["Manual reporting"],
      opportunityIdeas: ["Automated qualification"],
      positiveSignals: ["Sales team growth"],
      negativeSignals: [],
      opportunityAngle: "Reporting workflow audit",
      fitScore: 82,
    });

    expect(prompt).toContain("Compiler Labs");
    expect(prompt).toContain("opportunityAngles");
    expect(prompt).toContain("Reporting workflow audit");
  });

  it("parses JSON from model text", () => {
    const parsed = parseJsonObject<{ answer: string }>(
      'Here is JSON: {"answer":"yes"}',
      { answer: "no" },
    );

    expect(parsed.answer).toBe("yes");
  });
});
