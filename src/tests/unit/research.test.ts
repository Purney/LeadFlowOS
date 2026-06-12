import { describe, expect, it } from "vitest";
import { buildResearchSummaryPrompt } from "@/utils/ai-prompts";
import { clientResearchInputSchema } from "@/validation/research";

describe("client research validation and prompts", () => {
  it("normalises client research input lists", () => {
    const parsed = clientResearchInputSchema.parse({
      companyName: "Compiler Labs",
      website: "https://compiler.example",
      competitors: ["Existing vendor", ""],
      painHypotheses: ["Manual reporting"],
      opportunityIdeas: ["Workflow automation"],
      positiveSignals: ["Hiring ops roles"],
      negativeSignals: [],
      fitScore: 86,
      priority: "high",
      status: "researched",
    });

    expect(parsed.competitors).toEqual(["Existing vendor"]);
    expect(parsed.fitScore).toBe(86);
  });

  it("builds grounded research summary prompts", () => {
    const prompt = buildResearchSummaryPrompt({
      companyName: "Compiler Labs",
      website: "https://compiler.example",
      industry: "SaaS",
      companySize: "25-50",
      region: "UK",
      decisionMakerName: "Grace",
      decisionMakerRole: "COO",
      currentProvider: "Manual spreadsheets",
      competitors: ["Other Co"],
      painHypotheses: ["Manual lead routing"],
      opportunityIdeas: ["Automated qualification"],
      positiveSignals: ["Growing sales team"],
      negativeSignals: ["No visible engineering team"],
      notes: "Public website mentions operations bottlenecks.",
      outreachAngle: "Offer a workflow audit.",
      fitScore: 82,
    });

    expect(prompt).toContain("Return JSON only");
    expect(prompt).toContain("Compiler Labs");
    expect(prompt).toContain("Manual lead routing");
  });
});
