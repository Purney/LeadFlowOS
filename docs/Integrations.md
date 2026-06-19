# Integrations

LeadFlow OS currently integrates with Stripe, OpenAI, and an optional signature provider.

## Stripe

- Adapter/service code lives in the revenue domain.
- Stripe webhook ingress is `POST /api/webhooks/stripe`.
- Use separate development and production Stripe credentials.
- Webhook handlers must verify provider signatures and remain idempotent.

## OpenAI

- `src/services/openai-service.ts` owns text generation calls.
- AI is used for research summaries, discovery summaries, and proposal drafting.
- Cold email and reply drafting have been removed.
- Missing `OPENAI_API_KEY` should fail clearly when AI generation is called.

## Signature Provider

- Signature provider credentials are optional.
- Signing workflows must record provider failures without losing the local request state.

## Removed Mailgun Integration

Mailgun is no longer used. Campaign sending, warmup governance, inbound reply handling, and positive-reply automation have been removed.
