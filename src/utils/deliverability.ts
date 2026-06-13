import type { EmailHealth, WarmupStatus } from "@/types/sending";

export type WarmupRiskLevel = "blocked" | "watch" | "ready";

const DAY_MS = 86_400_000;

export function warmupAgeDays(warmupStartedAt?: Date) {
  if (!warmupStartedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - warmupStartedAt.getTime()) / DAY_MS));
}

export function buildWarmupChecklist(health: EmailHealth) {
  return [
    {
      id: "spf",
      label: "SPF configured",
      complete: health.spfConfigured,
      severity: "blocked" as const,
    },
    {
      id: "dkim",
      label: "DKIM configured",
      complete: health.dkimConfigured,
      severity: "blocked" as const,
    },
    {
      id: "dmarc",
      label: "DMARC configured",
      complete: health.dmarcConfigured,
      severity: "blocked" as const,
    },
    {
      id: "dns",
      label: "Forward/reverse DNS confirmed",
      complete: health.forwardReverseDnsConfigured,
      severity: "watch" as const,
    },
    {
      id: "tls",
      label: "TLS enabled",
      complete: health.tlsEnabled,
      severity: "watch" as const,
    },
    {
      id: "unsubscribe",
      label: "Unsubscribe supported",
      complete: health.unsubscribeSupported,
      severity: "blocked" as const,
    },
    {
      id: "one-click",
      label: "One-click unsubscribe supported",
      complete: health.oneClickUnsubscribeSupported,
      severity: "watch" as const,
    },
    {
      id: "blocklist",
      label: "No blocklist detected",
      complete: !health.blocklistDetected,
      severity: "blocked" as const,
    },
  ];
}

export function warmupRiskLevel(health: EmailHealth): WarmupRiskLevel {
  const checklist = buildWarmupChecklist(health);
  const blocked = checklist.some(
    (item) => item.severity === "blocked" && !item.complete,
  );

  if (
    blocked ||
    health.bounceRate >= 0.05 ||
    health.spamComplaintRate >= 0.003 ||
    health.deferralRate >= 0.1
  ) {
    return "blocked";
  }

  const watched = checklist.some((item) => item.severity === "watch" && !item.complete);
  if (
    watched ||
    health.bounceRate >= 0.03 ||
    health.spamComplaintRate >= 0.001 ||
    health.deferralRate >= 0.05
  ) {
    return "watch";
  }

  return "ready";
}

export function calculateHealthScore(health: EmailHealth) {
  let score = 100;

  if (!health.spfConfigured) score -= 20;
  if (!health.dkimConfigured) score -= 20;
  if (!health.dmarcConfigured) score -= 15;
  if (health.dmarcPolicy === "none") score -= 5;
  if (!health.forwardReverseDnsConfigured) score -= 10;
  if (!health.tlsEnabled) score -= 5;
  if (!health.trackingDomainConfigured) score -= 10;
  if (!health.unsubscribeSupported) score -= 20;
  if (!health.oneClickUnsubscribeSupported) score -= 5;
  if (health.blocklistDetected) score -= 35;
  score -= Math.min(25, Math.round(health.bounceRate * 100));
  score -= Math.min(25, Math.round(health.spamComplaintRate * 500));
  score -= Math.min(20, Math.round(health.deferralRate * 100));

  return Math.max(0, score);
}

export function recommendedSendVolume(input: {
  dailySendLimit: number;
  warmupTargetDailyVolume?: number;
  warmupStatus: WarmupStatus;
  warmupStartedAt?: Date;
  health: EmailHealth;
}) {
  if (input.warmupStatus === "paused" || warmupRiskLevel(input.health) === "blocked") {
    return 0;
  }

  if (input.warmupStatus === "ready") {
    return input.dailySendLimit;
  }

  if (input.warmupStatus === "not_started" || !input.warmupStartedAt) {
    return Math.min(5, input.dailySendLimit);
  }

  const elapsedDays = warmupAgeDays(input.warmupStartedAt);
  const target = input.warmupTargetDailyVolume ?? input.dailySendLimit;
  const ramp = 5 + elapsedDays * 5;

  return Math.min(input.dailySendLimit, target, ramp);
}

export function buildDeliverabilityWarnings(input: {
  dailySendLimit: number;
  estimatedVolume: number;
  recommendedVolume: number;
  health: EmailHealth;
  active: boolean;
}) {
  const warnings: string[] = [];

  if (!input.active) warnings.push("Sending account is inactive.");
  if (!input.health.spfConfigured) warnings.push("SPF is not configured.");
  if (!input.health.dkimConfigured) warnings.push("DKIM is not configured.");
  if (!input.health.dmarcConfigured) warnings.push("DMARC is not configured.");
  if (!input.health.forwardReverseDnsConfigured) {
    warnings.push("Forward and reverse DNS are not confirmed.");
  }
  if (!input.health.tlsEnabled) warnings.push("TLS support is not confirmed.");
  if (!input.health.unsubscribeSupported) {
    warnings.push("Unsubscribe support is not confirmed.");
  }
  if (!input.health.oneClickUnsubscribeSupported) {
    warnings.push("One-click unsubscribe support is not confirmed.");
  }
  if (input.health.blocklistDetected) warnings.push("Blocklist presence is detected.");
  if (input.health.bounceRate >= 0.03) warnings.push("Bounce rate is elevated.");
  if (input.health.spamComplaintRate >= 0.001) {
    warnings.push("Spam complaint rate is elevated.");
  }
  if (input.health.deferralRate >= 0.05) warnings.push("Deferral rate is elevated.");
  if (input.estimatedVolume > input.dailySendLimit) {
    warnings.push("Estimated volume exceeds the account daily limit.");
  }
  if (input.estimatedVolume > input.recommendedVolume) {
    warnings.push("Estimated volume exceeds the warm-up recommendation.");
  }

  return warnings;
}
