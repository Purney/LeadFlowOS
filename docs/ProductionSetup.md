# Production Setup

## 1. Database

Create a production MongoDB Atlas database and set `MONGODB_URI`.

## 2. Auth

Set:

```env
AUTH_SECRET=<long random secret>
AUTH_URL=https://your-production-domain
NEXT_PUBLIC_APP_URL=https://your-production-domain
APP_ENV=production
NODE_ENV=production
```

## 3. Stripe

Set Stripe credentials when revenue features are enabled:

```env
STRIPE_SECRET_KEY=<production Stripe secret>
STRIPE_WEBHOOK_SECRET=<production webhook secret>
```

Configure Stripe webhooks for:

```text
https://your-production-domain/api/webhooks/stripe
```

## 4. OpenAI

Set:

```env
OPENAI_API_KEY=<production OpenAI key>
OPENAI_MODEL=<model name>
```

## 5. Signature Provider

Set these only if signature workflows use an external provider:

```env
SIGNATURE_PROVIDER_API_KEY=<provider key>
SIGNATURE_PROVIDER_WEBHOOK_SECRET=<provider webhook secret>
```

## 6. Legacy Outreach Cleanup

Mailgun and cold outreach are no longer part of production setup. After deploying this removal, run:

```bash
npm run purge:outreach
```

Run it only against the intended database. The script deletes legacy outreach collections and maps old lead/lifecycle states into the CRM workflow.
