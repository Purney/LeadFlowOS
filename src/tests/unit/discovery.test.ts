import { describe, expect, it } from "vitest";
import { makeFieldId, validateDiscoveryAnswers } from "@/utils/discovery";
import { buildDiscoverySummaryPrompt } from "@/utils/ai-prompts";

describe("discovery utilities", () => {
  it("creates stable field ids", () => {
    expect(makeFieldId("Main objectives?", 0)).toBe("main_objectives");
  });

  it("validates required answers and option values", () => {
    const errors = validateDiscoveryAnswers(
      [
        {
          id: "objective",
          label: "Objective",
          type: "short_text",
          required: true,
          options: [],
        },
        {
          id: "budget",
          label: "Budget",
          type: "number",
          required: false,
          options: [],
        },
        {
          id: "priority",
          label: "Priority",
          type: "single_select",
          required: false,
          options: ["Speed", "Cost"],
        },
      ],
      { budget: "not-a-number", priority: "Quality" },
    );

    expect(errors).toEqual([
      "Objective is required.",
      "Budget must be a number.",
      "Priority must use a valid option.",
    ]);
  });

  it("builds discovery summary prompts", () => {
    const prompt = buildDiscoverySummaryPrompt({
      formName: "Project discovery",
      lead: { email: "ada@example.com", company: "Engines" },
      answers: [{ label: "Goal", answer: "Automate reporting" }],
    });

    expect(prompt).toContain("Project discovery");
    expect(prompt).toContain("Automate reporting");
    expect(prompt).toContain("recommendedScope");
  });
});
