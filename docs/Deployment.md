# Deployment

LeadFlow OS targets Vercel with MongoDB Atlas, Auth.js, Mailgun, Stripe, OpenAI, and optional signature-provider credentials.

For a step-by-step production setup flow, including how to obtain every environment variable, read [ProductionSetup.md](ProductionSetup.md).

## Required Production Environment

Set these in Vercel production environment variables:

- `NODE_ENV=production`
- `APP_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://your-domain.com`
- `MONGODB_URI=<production MongoDB Atlas URI>`
- `AUTH_SECRET=<long random secret>`
- `AUTH_URL=https://your-domain.com`
- `CRON_SECRET=<long random secret>`
- `MAILGUN_API_KEY=<production key>`
- `MAILGUN_DOMAIN=<production sending domain>`
- `MAILGUN_WEBHOOK_SIGNING_KEY=<production webhook signing key>`
- `MAILGUN_API_BASE_URL=<optional API base URL>`
- `STRIPE_SECRET_KEY=<production key>`
- `STRIPE_WEBHOOK_SECRET=<production webhook secret>`
- `OPENAI_API_KEY=<production key>`

Optional:

- `OPENAI_MODEL`
- `ALLOW_ADDITIONAL_ORG_SIGNUPS`
- `SIGNATURE_PROVIDER_API_KEY`
- `SIGNATURE_PROVIDER_WEBHOOK_SECRET`

Development, preview, and production must use separate MongoDB databases and provider credentials.

## Vercel

Current Vercel-specific files:

- `vercel.json`: cron schedule.
- `next.config.ts`: security headers.
- `src/app/api/cron/send-batches/route.ts`: cron endpoint.

Cron schedule:

```json
{
  "path": "/api/cron/send-batches",
  "schedule": "*/15 * * * *"
}
```

The cron endpoint requires:

```http
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron should supply this header automatically when `CRON_SECRET` is set.

## MongoDB Atlas

Production MongoDB requirements:

- Use a dedicated production database.
- Ensure indexes are created by Mongoose on first connection or run migrations/index creation explicitly if auto-indexing is disabled later.
- Configure network access for Vercel deployment.
- Monitor connection count, function cold starts, slow queries, and index usage.

The app reuses Mongoose connections through `src/lib/db.ts`.

## Webhook URLs

After deploying, configure provider webhooks:

Mailgun event webhook:

```text
https://your-domain.com/api/webhooks/mailgun/events
```

Mailgun inbound route:

```text
https://your-domain.com/api/webhooks/mailgun/inbound
```

Stripe webhook:

```text
https://your-domain.com/api/webhooks/stripe
```

Mailgun webhook calls must include:

- `x-leadflow-organisation-id`
- Mailgun signature fields: `timestamp`, `token`, and `signature`

Stripe webhook calls must include:

- `stripe-signature`
- `x-leadflow-organisation-id`

## Production Checklist

Before switching traffic:

- Run `npm run lint`.
- Run `npm run test`.
- Run `npm run build`.
- Confirm Vercel environment variables are set for Production.
- Confirm production MongoDB URI is not the development database.
- Confirm `AUTH_URL` and `NEXT_PUBLIC_APP_URL` match the production domain.
- Confirm `CRON_SECRET` is set.
- Configure Mailgun and Stripe webhooks.
- Create the first owner through `/signup`.
- Confirm `/dashboard` loads.
- Confirm `/api/cron/send-batches` rejects unauthenticated requests.
- Confirm webhook test events are accepted only with valid secrets/signatures.

## Scaling Notes

Current production assumptions:

- Vercel Functions are request bounded.
- Cron processes a bounded number of due approved batches.
- MongoDB-backed rate limiting is acceptable for moderate ingress.

Upgrade paths:

- Use Redis/Upstash for high-volume rate limiting.
- Use Trigger.dev, Inngest, QStash, or a worker queue for large email-send workloads.
- Add pagination to large list APIs.
- Add observability for cron duration, webhook failures, and provider retries.
