import { describe, expect, it } from "vitest";
import { buildProposalDraftPrompt } from "@/utils/ai-prompts";
import { proposalContentSchema } from "@/validation/proposal";

describe("proposal utilities", () => {
  it("validates structured proposal content", () => {
    const content = proposalContentSchema.parse({
      executiveSummary: "Summary",
      identifiedProblem: "Problem",
      proposedSolution: "Solution",
      deliverables: ["Workflow"],
      assumptions: ["Access provided"],
      estimatedTimeline: "2 weeks",
      optionalEnhancements: ["Dashboard"],
    });

    expect(content.deliverables).toEqual(["Workflow"]);
  });

  it("builds proposal draft prompts from discovery answers", () => {
    const prompt = buildProposalDraftPrompt({
      title: "Automation proposal",
      lead: { email: "client@example.com", company: "Client Co" },
      answers: [{ label: "Goal", answer: "Automate reporting" }],
    });

    expect(prompt).toContain("Automation proposal");
    expect(prompt).toContain("Automate reporting");
    expect(prompt).toContain("deliverables");
  });
});
