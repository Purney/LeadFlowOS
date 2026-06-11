import { describe, expect, it, vi } from "vitest";
import {
  buildDeliverabilityWarnings,
  calculateHealthScore,
  recommendedSendVolume,
} from "@/utils/deliverability";

const healthy = {
  spfConfigured: true,
  dkimConfigured: true,
  dmarcConfigured: true,
  trackingDomainConfigured: true,
  unsubscribeSupported: true,
  bounceRate: 0,
  spamComplaintRate: 0,
};

describe("deliverability", () => {
  it("scores a healthy sending account at 100", () => {
    expect(calculateHealthScore(healthy)).toBe(100);
  });

  it("ramps warm-up recommendations gradually", () => {
    vi.setSystemTime(new Date("2026-06-11T00:00:00.000Z"));

    expect(
      recommendedSendVolume({
        dailySendLimit: 100,
        warmupStatus: "warming",
        warmupStartedAt: new Date("2026-06-08T00:00:00.000Z"),
        health: healthy,
      }),
    ).toBe(25);

    vi.useRealTimers();
  });

  it("flags unsafe batches", () => {
    const warnings = buildDeliverabilityWarnings({
      dailySendLimit: 20,
      estimatedVolume: 30,
      recommendedVolume: 10,
      active: false,
      health: {
        ...healthy,
        spfConfigured: false,
        dkimConfigured: false,
        bounceRate: 0.05,
      },
    });

    expect(warnings).toContain("Sending account is inactive.");
    expect(warnings).toContain("SPF is not configured.");
    expect(warnings).toContain("Estimated volume exceeds the account daily limit.");
    expect(warnings).toContain("Estimated volume exceeds the warm-up recommendation.");
  });
});
