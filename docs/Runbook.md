# Runbook

Operational notes for debugging and maintaining LeadFlow OS.

## First Checks

If something is broken:

1. Check Vercel function logs.
2. Check MongoDB connectivity.
3. Confirm environment variables are set.
4. Run `npm run build` locally if the issue might be type/config related.
5. Check `ActivityLog` and `Notification` records for recent failures.

## Auth Issues

Symptoms:

- Login fails.
- Signup closed unexpectedly.
- Session missing organisation.

Check:

- `AUTH_SECRET`
- `AUTH_URL`
- `MONGODB_URI`
- `User` record exists.
- `SetupLock` exists only after initial setup.

If initial setup failed halfway, confirm whether a `SetupLock` exists without a user. The service tries to clean this up, but manual DB inspection may be needed after unexpected crashes.

## Cron Issues

Cron endpoint:

```text
/api/cron/send-batches
```

Checks:

- `CRON_SECRET` is set.
- `vercel.json` exists and has the expected schedule.
- Request includes `Authorization: Bearer <CRON_SECRET>`.
- Approved send batches have `scheduledSendTime <= now`.
- Sending account is active.
- Suppression/client/reply guards are not excluding recipients.

## Email Send Issues

Check:

- `SENDGRID_API_KEY`
- Sending account `active=true`.
- Sending account health and daily limit.
- Batch status is `approved`.
- Lead is not suppressed.
- Lead status is not `replied`, `won`, or `lost`.
- Lead email is not already a client contact.

Dry-run approved batch processing is supported in service tests and can be used as a debugging pattern.

## SendGrid Webhook Issues

Check:

- `SENDGRID_WEBHOOK_SECRET`
- `x-leadflow-webhook-secret`
- `x-leadflow-organisation-id`
- Rate-limit buckets if requests are getting `429`.
- `ActivityLog` for `webhook.failed`.

Inbound parse requires valid `from`, `to`, and `subject` fields.

## Stripe Webhook Issues

Check:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `stripe-signature`
- `x-leadflow-organisation-id`
- Vercel logs for signature verification failures.
- `ActivityLog` for `webhook.failed`.

## Portal Issues

For broken portal links:

- Confirm raw token was copied when created. Raw token is not stored.
- Check `PortalAccess.tokenHash`.
- Check `revokedAt` and `expiresAt`.
- Check the linked client exists.

For public signing:

- Signature request must be `sent`.
- Signature must belong to the portal client.

For portal documents:

- HTML is sanitized on write and render.
- If content appears stripped, check `src/utils/html.ts` allowlist.

## Rate Limiting

Rate-limit buckets live in `RateLimitBucket`.

If valid requests are blocked:

- Check key scope and IP headers.
- Check stale buckets and TTL behavior.
- Confirm deployment is using the expected database.

For high traffic, move to Redis/Upstash.

## Secret Rotation

General process:

1. Add new secret in provider.
2. Update Vercel environment variable.
3. Redeploy.
4. Update webhook/provider configuration if needed.
5. Verify with a test event.
6. Revoke old secret.

For `AUTH_SECRET`, rotating may invalidate sessions.

## Incident Notes

Prefer adding a short dated note to future `Runbook.md` updates if an incident reveals a new operational gotcha.

