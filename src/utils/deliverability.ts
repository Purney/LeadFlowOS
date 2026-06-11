import type { EmailHealth, WarmupStatus } from "@/types/sending";

export function calculateHealthScore(health: EmailHealth) {
  let score = 100;

  if (!health.spfConfigured) score -= 20;
  if (!health.dkimConfigured) score -= 20;
  if (!health.dmarcConfigured) score -= 15;
  if (!health.trackingDomainConfigured) score -= 10;
  if (!health.unsubscribeSupported) score -= 20;
  score -= Math.min(25, Math.round(health.bounceRate * 100));
  score -= Math.min(25, Math.round(health.spamComplaintRate * 500));

  return Math.max(0, score);
}

export function recommendedSendVolume(input: {
  dailySendLimit: number;
  warmupStatus: WarmupStatus;
  warmupStartedAt?: Date;
  health: EmailHealth;
}) {
  if (!input.health.unsubscribeSupported || input.warmupStatus === "paused") {
    return 0;
  }

  if (input.warmupStatus === "ready") {
    return input.dailySendLimit;
  }

  if (input.warmupStatus === "not_started" || !input.warmupStartedAt) {
    return Math.min(10, input.dailySendLimit);
  }

  const elapsedMs = Date.now() - input.warmupStartedAt.getTime();
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / 86_400_000));
  const ramp = 10 + elapsedDays * 5;

  return Math.min(input.dailySendLimit, ramp);
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
  if (!input.health.unsubscribeSupported) {
    warnings.push("Unsubscribe support is not confirmed.");
  }
  if (input.health.bounceRate >= 0.03) warnings.push("Bounce rate is elevated.");
  if (input.health.spamComplaintRate >= 0.001) {
    warnings.push("Spam complaint rate is elevated.");
  }
  if (input.estimatedVolume > input.dailySendLimit) {
    warnings.push("Estimated volume exceeds the account daily limit.");
  }
  if (input.estimatedVolume > input.recommendedVolume) {
    warnings.push("Estimated volume exceeds the warm-up recommendation.");
  }

  return warnings;
}
