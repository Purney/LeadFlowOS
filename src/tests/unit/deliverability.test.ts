import { describe, expect, it, vi } from "vitest";
import {
  buildDeliverabilityWarnings,
  buildWarmupChecklist,
  calculateHealthScore,
  recommendedSendVolume,
  warmupRiskLevel,
} from "@/utils/deliverability";

const healthy = {
  spfConfigured: true,
  dkimConfigured: true,
  dmarcConfigured: true,
  dmarcPolicy: "reject" as const,
  forwardReverseDnsConfigured: true,
  tlsEnabled: true,
  trackingDomainConfigured: true,
  unsubscribeSupported: true,
  oneClickUnsubscribeSupported: true,
  blocklistDetected: false,
  bounceRate: 0,
  spamComplaintRate: 0,
  deferralRate: 0,
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
    ).toBe(20);

    vi.useRealTimers();
  });

  it("blocks warm-up volume when core authentication is missing", () => {
    expect(
      recommendedSendVolume({
        dailySendLimit: 100,
        warmupStatus: "warming",
        warmupStartedAt: new Date("2026-06-08T00:00:00.000Z"),
        health: { ...healthy, dkimConfigured: false },
      }),
    ).toBe(0);
  });

  it("classifies warm-up risk from compliance and reputation signals", () => {
    expect(warmupRiskLevel(healthy)).toBe("ready");
    expect(warmupRiskLevel({ ...healthy, deferralRate: 0.06 })).toBe("watch");
    expect(warmupRiskLevel({ ...healthy, blocklistDetected: true })).toBe("blocked");
  });

  it("builds a checklist for the required warm-up controls", () => {
    expect(buildWarmupChecklist(healthy).map((item) => item.id)).toEqual([
      "spf",
      "dkim",
      "dmarc",
      "dns",
      "tls",
      "unsubscribe",
      "one-click",
      "blocklist",
    ]);
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
