import { describe, expect, it } from "vitest";
import {
  handoffStatuses,
  handoffTemplateTypes,
  paymentGateStatuses,
} from "@/types/handoff";
import { onboardingHandoffInputSchema } from "@/validation/handoff";

describe("onboarding handoff validation", () => {
  it("contains the planned handoff states", () => {
    expect(handoffStatuses).toContain("ready_for_execution");
    expect(paymentGateStatuses).toEqual([
      "not_required",
      "pending",
      "paid",
      "failed",
    ]);
    expect(handoffTemplateTypes).toContain("automation");
  });

  it("validates a payment-gated handoff request", () => {
    const parsed = onboardingHandoffInputSchema.parse({
      dealId: "507f1f77bcf86cd799439011",
      projectName: "Kickoff project",
      paymentDueCents: 250000,
      requirePaymentBeforeKickoff: true,
      createProject: true,
      createPortalAccess: true,
    });

    expect(parsed.paymentDueCents).toBe(250000);
    expect(parsed.projectType).toBe("automation");
  });
});
