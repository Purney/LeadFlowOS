# Phase 21 Warmup Governance

Phase 21 adds deliverability safeguards before cold outreach scales.

## Scope

- Extends sending account health with SPF, DKIM, DMARC policy, forward/reverse DNS, TLS, unsubscribe, one-click unsubscribe, blocklist, bounce, complaint, and deferral signals.
- Adds warmup governance fields for per-domain daily caps, target daily warmup volume, reputation status, and deliverability review timestamps.
- Tightens recommended send volume so accounts are blocked when core authentication, unsubscribe support, blocklist, or severe reputation signals are unsafe.
- Enforces per-recipient-domain caps when generating approval batches.
- Adds sending dashboard visibility for blocked and watch-list warmup accounts.

## Warmup Rules

The current policy blocks recommended sending volume when:

- SPF, DKIM, or DMARC is missing.
- Unsubscribe support is not confirmed.
- A blocklist is detected.
- Bounce rate is at least 5%.
- Spam complaint rate is at least 0.3%.
- Deferral rate is at least 10%.

The policy puts accounts on watch when:

- Forward/reverse DNS, TLS, or one-click unsubscribe support is missing.
- Bounce rate is at least 3%.
- Spam complaint rate is at least 0.1%.
- Deferral rate is at least 5%.

## Design Notes

Stage 21 does not send artificial warmup conversations. It tracks real readiness signals, throttles volume, and helps operators scale only when deliverability inputs are healthy.

## Verification

Stage 21 adds or updates coverage for:

- Warmup checklist generation.
- Warmup risk classification.
- Blocked send-volume recommendation when core authentication is missing.
- Sending service metrics for blocked/watch accounts.
- Per-domain batch generation caps.
