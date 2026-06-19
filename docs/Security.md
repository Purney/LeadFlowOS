# Security

## Authentication And Tenancy

- Private app/API routes use Auth.js sessions.
- Session user shape includes `id`, `email`, `name`, `organisationId`, and `role`.
- Services must scope reads/writes by `organisationId`.
- When accepting foreign ids such as `leadId`, `clientId`, `projectId`, or `proposalId`, verify that the target record belongs to the current organisation.

## Public Routes

Public discovery and portal routes are token/slug based and must use persistent rate limiting.

Public routes include:

- `/d/[publicSlug]`
- `/portal/[token]`
- `/api/public/discovery/[publicSlug]`
- `/api/public/portal/[token]`

## Webhooks

Stripe webhook requests must verify provider signatures before mutating local state.

Mailgun webhooks have been removed.

## Data Handling

- Validate request bodies with Zod before service calls.
- Avoid storing provider secrets outside environment variables.
- Keep production and development databases separate.
- Keep HTML sanitization tests for any rich text rendering paths.

## Removed Outreach Surface

Campaign sending, warmup governance, automatic reply handling, and Mailgun webhook processing have been removed. No private route should expose campaign, send batch, sending account, suppression, Mailgun, or cold/reply AI behavior.
