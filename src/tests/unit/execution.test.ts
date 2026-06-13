import { describe, expect, it } from "vitest";
import {
  deliverableStatuses,
  executionTaskStatuses,
  milestoneStatuses,
  projectHealthStatuses,
} from "@/types/execution";
import { projectExecutionUpdateSchema } from "@/validation/execution";

describe("execution validation", () => {
  it("contains delivery status sets", () => {
    expect(projectHealthStatuses).toEqual(["on_track", "at_risk", "blocked"]);
    expect(milestoneStatuses).toContain("completed");
    expect(executionTaskStatuses).toContain("blocked");
    expect(deliverableStatuses).toContain("delivered");
  });

  it("validates project execution updates", () => {
    const parsed = projectExecutionUpdateSchema.parse({
      health: "at_risk",
      progressPercent: 45,
      clientVisibleSummary: "Milestone one is in review.",
    });

    expect(parsed.progressPercent).toBe(45);
  });
});
