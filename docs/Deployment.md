# Deployment

LeadFlow OS targets Vercel with MongoDB Atlas, Auth.js, Stripe, OpenAI, and optional signature-provider credentials.

## Required Environment Variables

- `NODE_ENV`
- `APP_ENV`
- `NEXT_PUBLIC_APP_URL`
- `MONGODB_URI`
- `AUTH_SECRET`
- `AUTH_URL`

## Optional Integration Variables

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SIGNATURE_PROVIDER_API_KEY`
- `SIGNATURE_PROVIDER_WEBHOOK_SECRET`
- `ALLOW_ADDITIONAL_ORG_SIGNUPS`

Mailgun variables are no longer required.

## Production Checklist

- Use a production MongoDB Atlas database separate from local/preview.
- Set Auth.js secrets and URLs for the production domain.
- Configure Stripe webhook delivery to `/api/webhooks/stripe`.
- Configure signature provider webhooks if that provider is enabled.
- Run `npm run lint`, `npm run test`, and `npm run build`.
- After deploying the outreach removal, run `npm run purge:outreach` once for databases with legacy outreach data.
