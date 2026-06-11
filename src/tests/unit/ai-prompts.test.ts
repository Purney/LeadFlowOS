import { describe, expect, it } from "vitest";
import {
  buildColdEmailPrompt,
  buildReplyDraftPrompt,
  parseJsonObject,
} from "@/utils/ai-prompts";

describe("AI prompts", () => {
  it("builds cold email prompts with lead and offer context", () => {
    const prompt = buildColdEmailPrompt({
      lead: {
        firstName: "Ada",
        email: "ada@example.com",
        company: "Analytical Engines",
        website: "https://example.com",
      },
      serviceOffer: "AI automation audit",
      campaignGoal: "Book discovery calls",
    });

    expect(prompt).toContain("Analytical Engines");
    expect(prompt).toContain("AI automation audit");
    expect(prompt).toContain("Return JSON only");
  });

  it("builds reply prompts with conversation history", () => {
    const prompt = buildReplyDraftPrompt({
      lead: { email: "grace@example.com", firstName: "Grace" },
      messages: [
        {
          direction: "inbound",
          subject: "Re: Idea",
          body: "Interested.",
        },
      ],
    });

    expect(prompt).toContain("[inbound] Re: Idea");
    expect(prompt).toContain("suggestedResponse");
  });

  it("parses JSON from model text", () => {
    const parsed = parseJsonObject<{ answer: string }>(
      'Here is JSON: {"answer":"yes"}',
      { answer: "no" },
    );

    expect(parsed.answer).toBe("yes");
  });
});
