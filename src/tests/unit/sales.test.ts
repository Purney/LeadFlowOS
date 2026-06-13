import { describe, expect, it } from "vitest";
import { dealStatusForStage, dealStageLabels, dealStages } from "@/types/sales";
import { dealInputSchema } from "@/validation/sales";

describe("sales pipeline helpers", () => {
  it("contains the planned sales stages", () => {
    expect(dealStages).toEqual([
      "discovery_booked",
      "discovery_complete",
      "proposal_drafted",
      "proposal_sent",
      "negotiation",
      "won",
      "lost",
    ]);
    expect(dealStageLabels.proposal_sent).toBe("Proposal Sent");
  });

  it("derives deal status from terminal stages", () => {
    expect(dealStatusForStage("negotiation")).toBe("active");
    expect(dealStatusForStage("won")).toBe("won");
    expect(dealStatusForStage("lost")).toBe("lost");
  });

  it("validates deal input", () => {
    const parsed = dealInputSchema.parse({
      title: "Automation rollout",
      companyName: "Compiler Labs",
      valueCents: 2500000,
      probability: 60,
      stage: "proposal_sent",
    });

    expect(parsed.stage).toBe("proposal_sent");
    expect(parsed.valueCents).toBe(2500000);
  });
});
