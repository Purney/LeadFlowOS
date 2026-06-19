# Runbook

## First Checks

- Confirm `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`, and `NEXT_PUBLIC_APP_URL`.
- Confirm the user belongs to the expected organisation.
- Check server logs for Zod validation failures, database connection errors, or provider credential errors.

## CRM Workflow

- A manually created lead should default to `discovery_booked`.
- Lead sync should create a lifecycle account in `proposal_sales`.
- Client conversion should move linked lifecycle accounts to `onboarding_payment`.

## Integrations

- Stripe issues: verify `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and webhook delivery.
- OpenAI issues: verify `OPENAI_API_KEY` and `OPENAI_MODEL`.
- Signature issues: verify provider credentials and local signature request state.

## Legacy Outreach Cleanup

After deploying the removal to an environment with old outreach data:

```bash
npm run purge:outreach
```

Use the production database connection only when you intend to purge production data. The script deletes legacy outreach collections and rewrites old lead/lifecycle states into the current CRM workflow.
