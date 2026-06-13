# Production Setup Guide

This guide walks through setting up a production LeadFlow OS environment on Vercel with MongoDB Atlas, Auth.js, Mailgun, Stripe, OpenAI, and optional signature-provider credentials.

Use this guide before the first production deployment and whenever production secrets need to be rotated.

## 1. Production Accounts Needed

Create or confirm access to:

- Vercel team/project for hosting.
- MongoDB Atlas project and production cluster.
- Domain DNS provider for the production app domain.
- Mailgun account for production outbound/inbound email.
- Stripe account with live mode enabled.
- OpenAI platform project.
- Optional external signature provider.

Use separate production credentials from development and preview. Never reuse development databases, Stripe test keys, Mailgun sandbox credentials, or webhook signing keys in production.

## 2. Production Domain

Choose the canonical production URL first, for example:

```text
https://app.leadflow.example
```

This value is used by:

- `NEXT_PUBLIC_APP_URL`
- `AUTH_URL`
- Provider webhook URLs
- Public discovery links
- Public portal links

In Vercel:

1. Open the LeadFlow OS project.
2. Go to **Settings -> Domains**.
3. Add the production domain.
4. Follow Vercel's DNS instructions at your DNS provider.
5. Wait for Vercel to show the domain as valid and protected by HTTPS.

## 3. Generate Internal Secrets

Generate these before entering Vercel environment variables:

- `AUTH_SECRET`
- `CRON_SECRET`
- `MAILGUN_WEBHOOK_SIGNING_KEY`

PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Run it once for each secret and store the values in a password manager. Do not commit them to the repository.

`AUTH_SECRET` encrypts Auth.js JWT/session data. Rotating it can invalidate active sessions.

`CRON_SECRET` protects `/api/cron/send-batches`.

`MAILGUN_WEBHOOK_SIGNING_KEY` verifies Mailgun webhook `timestamp`, `token`, and `signature` values.

## 4. MongoDB Atlas

Create a dedicated production database.

1. In MongoDB Atlas, create or select the production project.
2. Create a production cluster.
3. Create a database user with access to the production database only where possible.
4. Configure network access for Vercel. If strict IP allowlisting is not possible because of serverless egress, use the narrowest practical Atlas network policy for your deployment posture.
5. In the cluster, click **Connect**.
6. Choose **Drivers** or **Connect your application**.
7. Copy the connection string.
8. Replace the username, password, and database name.

Example:

```text
mongodb+srv://leadflow-prod-user:<password>@cluster-name.mongodb.net/leadflowos-prod?retryWrites=true&w=majority
```

Set this as:

```env
MONGODB_URI=<production MongoDB Atlas URI>
```

Production notes:

- Use a production database name such as `leadflowos-prod`.
- Do not point production at `leadflowos-dev`.
- Store the Atlas database password in a password manager.
- Confirm the app can create indexes on first connection unless index creation is handled separately later.

## 5. Vercel Project Setup

In Vercel:

1. Import the repository.
2. Select the production branch, usually `main`.
3. Keep the package manager as npm.
4. Use the default Next.js build command unless Vercel detects otherwise:

```text
npm run build
```

5. Open **Settings -> Environment Variables**.
6. Add all required variables for the **Production** environment.

Vercel environment variable changes apply to new deployments only. Redeploy after changing production secrets.

## 6. Required Vercel Environment Variables

Set these for **Production**:

```env
NODE_ENV=production
APP_ENV=production
NEXT_PUBLIC_APP_URL=https://app.leadflow.example
AUTH_URL=https://app.leadflow.example
AUTH_SECRET=<generated-auth-secret>
MONGODB_URI=<production MongoDB Atlas URI>
CRON_SECRET=<generated-cron-secret>
MAILGUN_API_KEY=<production Mailgun API key>
MAILGUN_DOMAIN=<production Mailgun sending domain>
MAILGUN_WEBHOOK_SIGNING_KEY=<production Mailgun webhook signing key>
MAILGUN_API_BASE_URL=
STRIPE_SECRET_KEY=<live Stripe restricted or secret key>
STRIPE_WEBHOOK_SECRET=<Stripe webhook signing secret>
OPENAI_API_KEY=<OpenAI project API key>
OPENAI_MODEL=gpt-4.1-mini
ALLOW_ADDITIONAL_ORG_SIGNUPS=false
```

Optional:

```env
SIGNATURE_PROVIDER_API_KEY=<production signature provider key>
SIGNATURE_PROVIDER_WEBHOOK_SECRET=<production signature webhook secret>
```

## 7. Environment Variable Source Map

| Variable | Required | Where to get it | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | Set manually | Use `production` in Vercel Production. |
| `APP_ENV` | Yes | Set manually | Use `production`. |
| `NEXT_PUBLIC_APP_URL` | Yes | Production domain | Must include `https://` and no trailing slash. |
| `AUTH_URL` | Yes | Production domain | Same origin as `NEXT_PUBLIC_APP_URL`. |
| `AUTH_SECRET` | Yes | Generate internally | Use a long random value. Store in password manager. |
| `MONGODB_URI` | Yes | MongoDB Atlas connect dialog | Use the production cluster/database. |
| `CRON_SECRET` | Yes | Generate internally | Used by `/api/cron/send-batches`. |
| `MAILGUN_API_KEY` | Yes for sending | Mailgun account API security settings | Use a production Mailgun API key. |
| `MAILGUN_DOMAIN` | Yes for sending | Mailgun sending domain settings | Use the verified production sending domain, for example `mg.example.com`. |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | Yes for webhooks | Mailgun webhook signing key | Used to verify Mailgun webhook signatures. |
| `MAILGUN_API_BASE_URL` | Optional | Mailgun region settings | Leave blank for US; use `https://api.eu.mailgun.net` for EU infrastructure. |
| `STRIPE_SECRET_KEY` | Yes for Stripe | Stripe Dashboard -> Developers -> API keys | Prefer restricted live key if permissions are sufficient. |
| `STRIPE_WEBHOOK_SECRET` | Yes for Stripe webhooks | Stripe Dashboard -> Webhooks -> endpoint signing secret | Separate from API key. Starts with `whsec_`. |
| `OPENAI_API_KEY` | Yes for AI features | OpenAI platform project API keys | Use a production project/key. |
| `OPENAI_MODEL` | Optional | Set manually | Defaults are handled by the app, but set explicitly for production. |
| `ALLOW_ADDITIONAL_ORG_SIGNUPS` | Optional | Set manually | Keep `false` after first owner setup. |
| `SIGNATURE_PROVIDER_API_KEY` | Optional | Signature provider dashboard | Required only when external signature delivery is enabled. |
| `SIGNATURE_PROVIDER_WEBHOOK_SECRET` | Optional | Signature provider dashboard or generated internally | Required only when external signature webhooks are implemented/enabled. |

## 8. Mailgun Setup

### API Key

1. Log in to Mailgun.
2. Go to the account/API security area.
3. Click **Create API Key**.
4. Prefer a restricted/custom key with the least permissions needed for mail send and relevant account activity. Use full access only temporarily if the exact permission set is not known.
5. Copy the key immediately.
6. Store it in Vercel as `MAILGUN_API_KEY`.

### Sender Authentication And Warmup

Before sending cold outreach:

1. Add and verify the sending domain in Mailgun.
2. Configure SPF, DKIM, and DMARC in DNS.
3. Configure link branding/tracking domain if used.
4. Configure reverse DNS if using dedicated IPs.
5. Add the sending account in `/sending`.
6. Mark the Stage 21 warmup health fields truthfully.
7. Keep warmup status at `not_started` or `warming` until the domain has clean reputation signals.

Do not use fake warmup conversations. LeadFlow OS warmup governance is based on real DNS, reputation, bounce, complaint, deferral, suppression, and provider-event signals.

### Event Webhook

After the production app is deployed and the first organisation exists:

1. Get the production organisation ID from MongoDB Atlas:
   - Open the `organisations` collection.
   - Copy the `_id` for the production organisation created by first-owner signup.
2. In Mailgun, configure the Event Webhook URL:

```text
https://app.leadflow.example/api/webhooks/mailgun/events
```

3. Configure the webhook to send the event types used by the app:
   - delivered
   - open
   - click
   - bounce
   - unsubscribe
   - spam report
4. Confirm the webhook signing key is copied to Vercel as `MAILGUN_WEBHOOK_SIGNING_KEY`.
5. If organisation routing cannot be supplied through Mailgun message variables, add this request header through your webhook forwarding layer:

```text
x-leadflow-organisation-id: <production organisation _id>
```

Outbound messages include Mailgun user variables for organisation and message IDs; event webhooks can use those variables to route events.

### Inbound Parse

Configure inbound routes only after DNS for the inbound domain/subdomain is ready.

Webhook URL:

```text
https://app.leadflow.example/api/webhooks/mailgun/inbound
```

Required forwarding header:

```text
x-leadflow-organisation-id: <production organisation _id>
```

## 9. Stripe Setup

Use Stripe live mode for production.

### API Key

1. Open Stripe Dashboard.
2. Switch to **live mode**.
3. Go to **Developers -> API keys**.
4. Prefer creating a restricted live key if it supports the required operations.
5. Otherwise reveal/copy the live secret key.
6. Store it in Vercel as `STRIPE_SECRET_KEY`.

Expected formats:

```text
rk_live_...
sk_live_...
```

Do not use:

```text
sk_test_...
rk_test_...
```

### Webhook Endpoint

1. In Stripe Dashboard, go to **Developers -> Webhooks**.
2. Create an endpoint:

```text
https://app.leadflow.example/api/webhooks/stripe
```

3. Subscribe to the events handled by the app:
   - `customer.created`
   - `invoice.created`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy the endpoint signing secret.
5. Store it in Vercel as `STRIPE_WEBHOOK_SECRET`.
6. Add the production organisation ID to webhook delivery headers as:

```text
x-leadflow-organisation-id: <production organisation _id>
```

If Stripe Dashboard does not support the required custom header for your setup, add an event-forwarding layer or update the app to resolve the organisation another way before enabling multi-tenant production Stripe webhooks.

## 10. OpenAI Setup

1. Open the OpenAI platform.
2. Create or select the production project.
3. Create a production API key.
4. Store it in Vercel as `OPENAI_API_KEY`.
5. Set `OPENAI_MODEL` to the approved production model for AI drafts.

The app uses OpenAI for draft generation. Generated content is stored for manual review and is not sent automatically.

## 11. Optional Signature Provider

The current app has an external signature provider adapter shell. Internal/public signing works without a provider.

Only set these when a real provider integration is configured:

```env
SIGNATURE_PROVIDER_API_KEY=<provider key>
SIGNATURE_PROVIDER_WEBHOOK_SECRET=<provider webhook secret>
```

Keep these blank if external signature delivery is not enabled.

## 12. Deploy Production

Before deploying:

```bash
npm run lint
npm run test
npm run build
```

Deploy through Vercel:

- Push to the production branch, or
- Run `vercel --prod` if using the CLI.

After deployment:

1. Open the production domain.
2. Confirm the app redirects to `/signup` if no owner exists.
3. Create the first owner.
4. Confirm `/dashboard` loads.
5. Set `ALLOW_ADDITIONAL_ORG_SIGNUPS=false` if it was not already false.
6. Retrieve the production organisation ID from MongoDB Atlas.
7. Finish Mailgun and Stripe webhook routing details that need the organisation ID.

## 13. Cron Verification

The app includes `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-batches",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Vercel triggers cron jobs by sending a `GET` request to the configured production path.

Manual check:

```bash
curl -i https://app.leadflow.example/api/cron/send-batches
```

Expected result without auth:

```text
401 Unauthorized
```

Authorized check:

```bash
curl -i https://app.leadflow.example/api/cron/send-batches \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Expected result:

```text
200 OK
```

The response should report processed batches, even if the count is zero.

## 14. Webhook Verification

Stripe:

- Use Stripe Dashboard webhook test delivery after `STRIPE_WEBHOOK_SECRET` is set.
- Confirm Vercel logs show accepted events.
- Confirm invalid signatures are rejected.

Mailgun:

- Use Mailgun webhook test tools if available.
- Confirm invalid Mailgun signatures are rejected.
- Confirm missing `x-leadflow-organisation-id` is rejected.
- Confirm valid events create `EmailEvent` records.

## 15. Production Smoke Checklist

Run this after first production deployment:

- App loads over HTTPS.
- `/signup` creates the first owner.
- `/login` works.
- `/dashboard` loads after login.
- `/command` loads after login.
- `/sending` loads after login.
- MongoDB Atlas shows `organisations`, `users`, and `activitylogs` records.
- `ALLOW_ADDITIONAL_ORG_SIGNUPS=false`.
- `/api/cron/send-batches` rejects unauthenticated requests.
- Mailgun API key is production and not blank.
- Stripe key is live mode and not test mode.
- Stripe webhook endpoint has the production URL and signing secret.
- OpenAI draft generation fails clearly if no key is set, or succeeds if the production key is set.
- Public/webhook rate limiting uses the production MongoDB database.

## 16. Secret Rotation

Rotate secrets one provider at a time.

General process:

1. Create the replacement secret/key in the provider or generate a new internal secret.
2. Add the new value to Vercel Production environment variables.
3. Redeploy production.
4. Verify the affected feature.
5. Revoke the old secret/key.
6. Record the rotation in the team password manager.

Special cases:

- Rotating `AUTH_SECRET` may invalidate sessions.
- Rotating `STRIPE_WEBHOOK_SECRET` requires updating the Stripe webhook endpoint secret in Vercel.
- Rotating `MAILGUN_WEBHOOK_SIGNING_KEY` requires updating the Vercel environment variable and confirming Mailgun webhook signature verification.
- Rotating `MONGODB_URI` requires confirming the new database has expected indexes and data.

## 17. Official References

- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel cron jobs: https://vercel.com/docs/cron-jobs
- MongoDB Atlas application connection: https://www.mongodb.com/docs/atlas/driver-connection/
- Auth.js secret/session behavior: https://authjs.dev/reference/core
- Mailgun Node SDK: https://documentation.mailgun.com/docs/mailgun/sdk/nodejs_sdk
- Mailgun webhooks: https://documentation.mailgun.com/docs/mailgun/user-manual/events/webhooks/
- Stripe API keys: https://docs.stripe.com/keys
- Stripe webhooks: https://docs.stripe.com/webhooks
- OpenAI API quickstart: https://developers.openai.com/api/docs/quickstart
