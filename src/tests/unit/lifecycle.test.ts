import { describe, expect, it } from "vitest";
import {
  getNextLifecycleStage,
  isLifecycleStage,
  lifecycleStageLabels,
  lifecycleStages,
} from "@/types/lifecycle";
import { lifecycleAccountInputSchema } from "@/validation/lifecycle";

describe("lifecycle helpers", () => {
  it("contains the full business operating sequence", () => {
    expect(lifecycleStages).toEqual([
      "client_research",
      "cold_outreach",
      "proposal_sales",
      "onboarding_payment",
      "solution_execution",
      "maintenance",
    ]);
    expect(lifecycleStageLabels.maintenance).toBe("Maintenance");
  });

  it("validates stages and next-stage transitions", () => {
    expect(isLifecycleStage("cold_outreach")).toBe(true);
    expect(isLifecycleStage("unknown")).toBe(false);
    expect(getNextLifecycleStage("proposal_sales")).toBe("onboarding_payment");
    expect(getNextLifecycleStage("maintenance")).toBeNull();
  });

  it("validates lifecycle account input", () => {
    const parsed = lifecycleAccountInputSchema.parse({
      name: "Compiler Labs",
      primaryEmail: "hello@example.com",
      stage: "client_research",
      status: "active",
      fitScore: 82,
      tags: ["enterprise"],
    });

    expect(parsed.stage).toBe("client_research");
    expect(parsed.fitScore).toBe(82);
  });
});
