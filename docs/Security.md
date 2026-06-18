# Security

This document describes the security conventions for LeadFlow OS. Future agents should read this before changing authentication, public routes, webhooks, tenant-owned data, stored HTML, or deployment configuration.

## Authentication

Authentication uses Auth.js in `src/auth.ts`.

- Session strategy is JWT.
- Credentials login is currently the only provider.
- Session user shape includes `id`, `email`, `name`, `organisationId`, and `role`.
- Roles are `owner`, `admin`, and `member`.

Current role enforcement is limited. Most protection comes from authentication and organisation-scoped queries. If adding role-based behavior, centralize it in shared helpers instead of scattering checks across route handlers.

## Passwords

Passwords are hashed with `bcryptjs` through `src/lib/password.ts`.

Rules:

- Never store raw passwords.
- Never return password hashes from route handlers.
- Keep all credential verification server-side.

## First Owner Signup

First-owner signup is handled by `createFirstOwner` in `src/services/auth-service.ts`.

Security details:

- `SetupLock` prevents concurrent first-owner signup races.
- Additional organisation signup is blocked unless `ALLOW_ADDITIONAL_ORG_SIGNUPS=true`.
- If owner creation fails after the setup lock is acquired, the lock is removed so setup can be retried.

When editing signup behavior, preserve the setup-lock race protection.

## Tenant Isolation

Most tenant-owned records include `organisationId`.

Rules:

- Internal services must query by `organisationId`.
- Never trust object IDs from a request without checking ownership.
- When updating references such as `clientId`, `projectId`, `proposalId`, or `leadId`, verify the target document belongs to the current organisation.
- Public portal routes must use token-scoped data only.
- Public discovery routes must use public slug-scoped data only.

Common anti-pattern:

```ts
Project.findById(projectId)
```

Preferred pattern:

```ts
Project.findOne({
  _id: toObjectId(projectId),
  organisationId: toObjectId(context.organisationId),
})
```

## Public Portal Tokens

Portal access uses `PortalAccess`.

- Public token is generated once and returned to the internal user.
- Only the hash is stored in MongoDB.
- Public portal lookup hashes the supplied token and checks `revokedAt` and `expiresAt`.

Do not store raw portal tokens. Do not expose unrelated organisation data in public portal responses.

## Webhooks

Webhook routes:

- `/api/webhooks/mailgun/events`
- `/api/webhooks/mailgun/inbound`
- `/api/webhooks/stripe`

Rules:

- Verify cheap headers/secrets before hitting MongoDB-backed rate limiting.
- Verify Stripe signatures before processing events.
- Verify Mailgun webhook signatures before processing events.
- Log webhook failures through activity records.
- Do not return provider secrets or stack traces in error responses.

## Rate Limiting

Public and webhook ingress uses MongoDB-backed rate limiting in `src/lib/rate-limit.ts`.

- `RateLimitBucket` stores shared counters.
- TTL index removes expired buckets.
- Persistent limiter uses conditional updates and `$inc`.

Current implementation is suitable for moderate Vercel traffic. For high traffic, replace with Redis/Upstash atomic counters.

## Stored HTML

`PdfExport` stores rich HTML document snapshots.

Rules:

- Sanitize stored HTML with `sanitizeRichHtml`.
- Sanitize again before rendering public portal HTML.
- Only allow tags defined in `src/utils/html.ts`.
- Do not allow event attributes or script/style tags.

If adding direct HTML editing, update sanitizer tests before expanding the allowlist.

## Email Safety

Campaign emails must not send automatically.

Required flow:

1. Create campaign.
2. Enroll leads.
3. Generate send batch.
4. Manually approve batch.
5. Process approved batch.

Positive-reply booking automation is the deliberate exception. It only runs after a lead has replied inbound, the organisation has explicitly enabled the setting, and the reply text is classified as positive by the service. The auto-response template is organisation-scoped and provider failures are recorded on the outbound `EmailMessage` rather than failing inbound webhook processing.

Send-batch generation must filter:

- Suppressed emails.
- Replied/won/lost leads.
- Existing clients.
- Inactive sending accounts.
- Volumes above daily or warm-up limits.
- Missing core authentication or unsubscribe support.
- Blocklisted sending identities.
- High bounce, complaint, or deferral rates.
- Recipient-domain volumes above the sending account per-domain cap.

Warmup governance does not use artificial engagement. Keep deliverability controls based on real provider, DNS, suppression, and event signals.

Campaign templates can include custom-field tokens, `{GLOBAL_SIGNATURE}`, `{BOOKING_LINK}`, and spintax. Keep rendering server-side and do not expose provider credentials or send actions to client components.

## Security Headers

Security headers are configured in `next.config.ts`.

Headers include:

- HSTS
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- CSP

The current CSP permits inline/eval scripts because of Next.js/runtime constraints. Tighten this later if the app moves to a nonce-based CSP.

## Security Checklist For Future Changes

Before merging changes:

- Is every internal API route authenticated?
- Is every request body validated with Zod?
- Are all tenant-owned queries scoped by `organisationId`?
- Are referenced IDs checked for same-organisation ownership?
- Are public routes token/slug-scoped only?
- Are provider secrets server-only?
- Is stored HTML sanitized?
- Are webhooks verified before processing?
- Are large public inputs rate-limited?
