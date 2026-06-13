# Integrations

This document describes external integration boundaries and conventions.

## General Rules

- Integration credentials live in environment variables.
- Adapter services must fail clearly when required credentials are missing.
- Provider calls must stay server-side.
- Store provider IDs and raw webhook payloads where useful for audit/debugging.
- Never let provider output automatically send client-facing communication without manual review unless explicitly designed.

## SendGrid

Files:

- `src/services/sendgrid-service.ts`
- `src/services/email-service.ts`
- `src/app/api/webhooks/sendgrid/events/route.ts`
- `src/app/api/webhooks/sendgrid/inbound/route.ts`

Environment:

- `SENDGRID_API_KEY`
- `SENDGRID_WEBHOOK_SECRET`

Outbound flow:

1. Generate send batch.
2. Manually approve batch.
3. Process approved batch.
4. `sendSendGridMessage` sends each message.
5. `EmailMessage` records provider message ID.

Warmup governance:

- Sending account readiness is tracked in `EmailAccount.health`.
- `src/utils/deliverability.ts` owns health scoring, warmup checklist, risk classification, and recommended send volume.
- Batch generation blocks unsafe warmup volume and enforces per-recipient-domain caps before approval.
- The app does not send artificial warmup conversations. It relies on real authentication, reputation, bounce, complaint, deferral, blocklist, unsubscribe, and provider-event signals.

Inbound/event behavior:

- Delivery/open/click/bounce/unsubscribe/spam events are stored as `EmailEvent`.
- Bounce/unsubscribe/spam creates suppressions.
- Inbound replies create inbound `EmailMessage`, update lead status to `replied`, and pause campaign enrollment.

## Stripe

Files:

- `src/services/stripe-service.ts`
- `src/services/revenue-service.ts`
- `src/app/api/webhooks/stripe/route.ts`

Environment:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Handled events:

- `customer.created`
- `invoice.created`
- `invoice.paid`
- `invoice.payment_failed`
- `checkout.session.completed`
- `payment_intent.succeeded`

Stripe signatures are verified before event processing.

## OpenAI

Files:

- `src/services/openai-service.ts`
- `src/services/ai-service.ts`
- `src/utils/ai-prompts.ts`

Environment:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

AI features:

- Cold email drafts.
- Reply drafts.
- Discovery summaries.
- Proposal drafts.

Generated content is stored as drafts/manual artifacts. It is not sent automatically.

## Signature Provider

Files:

- `src/services/signature-provider-service.ts`
- `src/services/portal-service.ts`

Environment:

- `SIGNATURE_PROVIDER_API_KEY`
- `SIGNATURE_PROVIDER_WEBHOOK_SECRET`

Current state:

- Internal/public signing works without an external provider.
- External provider mode validates credentials and fails clearly until provider SDK implementation is added.

Future implementation should:

- Create provider envelope.
- Store provider envelope ID, status, and signing URL.
- Add provider webhook route.
- Map provider completion back to `SignatureRequest`.
- Keep internal fallback signing intact.

## PDF Export

Files:

- `src/services/portal-service.ts`
- `src/utils/html.ts`
- `src/utils/pdf.ts`

PDF exports are sanitized HTML snapshots rendered to lightweight PDF bytes. This is enough for MVP. For polished PDFs, add a dedicated renderer or service.
