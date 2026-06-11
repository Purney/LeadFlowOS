import { describe, expect, it } from "vitest";
import {
  allocateVariant,
  scheduleCampaignStep,
} from "@/utils/campaign-scheduling";

describe("campaign scheduling", () => {
  it("schedules a step by delay days in UTC", () => {
    const scheduled = scheduleCampaignStep(
      new Date("2026-06-11T12:00:00.000Z"),
      3,
    );

    expect(scheduled.toISOString()).toBe("2026-06-14T12:00:00.000Z");
  });

  it("allocates variants deterministically", () => {
    const first = allocateVariant("campaign:lead:0", 2, 3);
    const second = allocateVariant("campaign:lead:0", 2, 3);

    expect(first).toEqual(second);
    expect(first.subjectIndex).toBeGreaterThanOrEqual(0);
    expect(first.subjectIndex).toBeLessThan(2);
    expect(first.bodyIndex).toBeGreaterThanOrEqual(0);
    expect(first.bodyIndex).toBeLessThan(3);
  });
});
