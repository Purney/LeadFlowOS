# API Reference

This is a high-level route map. For exact schemas, read `src/validation`.

## Conventions

- Internal routes require `auth()`.
- Internal routes use the session `organisationId`.
- Request bodies are validated with Zod.
- Public routes are scoped by public slug or portal token.
- Webhook routes verify provider secrets/signatures.
- Public and webhook write routes use rate limiting.

## Authentication

- `POST /api/signup`: First-owner signup. Blocked after setup unless additional signups are explicitly enabled.
- `/api/auth/[...nextauth]`: Auth.js handlers.

## Leads

- `GET /api/leads`: List/search/filter leads.
- `POST /api/leads`: Create lead or import leads depending on request body mode.
- `PATCH /api/leads/[leadId]`: Update scoped lead.
- `DELETE /api/leads/[leadId]`: Delete scoped lead.

## Account Lifecycle

- `GET /api/accounts`: List/search/filter unified lifecycle accounts.
- `POST /api/accounts`: Create a manually researched lifecycle account.
- `PATCH /api/accounts/[accountId]/stage`: Move a scoped account to another business lifecycle stage.

## Campaigns

- `GET /api/campaigns`: List campaigns.
- `POST /api/campaigns`: Create campaign.
- `PATCH /api/campaigns/[campaignId]`: Update campaign.
- `POST /api/campaigns/[campaignId]/enrollments`: Enroll leads.

## Sending

- `GET /api/email-accounts`: List sending accounts.
- `POST /api/email-accounts`: Create sending account.
- `PATCH /api/email-accounts/[accountId]`: Update sending account.
- `GET /api/send-batches`: List send batches.
- `POST /api/send-batches`: Generate manual approval batch.
- `PATCH /api/send-batches/[batchId]`: Update/approve/reject/reschedule batch.
- `POST /api/send-batches/[batchId]/process`: Process approved batch.
- `GET /api/suppressions`: List suppressions.
- `POST /api/suppressions`: Create suppression.

## AI

- `POST /api/ai/cold-email`: Generate stored cold email draft.
- `POST /api/ai/reply-draft`: Generate stored reply draft.

## Discovery

- `GET /api/discovery/forms`: List internal forms.
- `POST /api/discovery/forms`: Create form.
- `PATCH /api/discovery/forms/[formId]`: Update form.
- `POST /api/discovery/summaries`: Generate AI summary for a response.
- `GET /api/public/discovery/[publicSlug]`: Public form definition.
- `POST /api/public/discovery/[publicSlug]/responses`: Public form response submission.

## Proposals

- `GET /api/proposals`: List proposals.
- `POST /api/proposals`: Create proposal or generate from discovery.
- `PATCH /api/proposals/[proposalId]`: Update proposal/status/content.

## Revenue

- `GET /api/webhooks/stripe`: Not used.
- `POST /api/webhooks/stripe`: Stripe webhook processor.

## Clients, Projects, Time

- `GET /api/clients`: List clients.
- `POST /api/clients`: Create client or convert lead to client.
- `GET /api/projects`: List projects.
- `POST /api/projects`: Create project.
- `PATCH /api/projects/[projectId]`: Update project.
- `GET /api/time-entries`: List recent time entries.
- `POST /api/time-entries`: Create time entry.

## Portal

- `GET /api/portal-accesses`: List portal accesses.
- `POST /api/portal-accesses`: Create portal access and return one-time raw token.
- `GET /api/onboarding-tasks`: List onboarding tasks.
- `POST /api/onboarding-tasks`: Create onboarding task.
- `PATCH /api/onboarding-tasks/[taskId]`: Update onboarding task.
- `POST /api/onboarding-automations`: Run kickoff task automation.
- `GET /api/signature-requests`: List signature requests.
- `POST /api/signature-requests`: Create signature request.
- `PATCH /api/signature-requests/[requestId]`: Update signature request status.
- `GET /api/pdf-exports`: List PDF exports.
- `POST /api/pdf-exports`: Create sanitized HTML PDF-ready export.
- `GET /api/pdf-exports/[exportId]/download`: Download internal PDF.
- `GET /api/portal-messages`: List portal messages.
- `POST /api/portal-messages`: Create internal portal message.

## Public Portal

- `POST /api/public/portal/[token]/messages`: Client posts portal message.
- `POST /api/public/portal/[token]/signatures/[requestId]`: Client signs request.
- `GET /api/public/portal/[token]/pdf-exports/[exportId]/download`: Client downloads token-scoped PDF.

## Notifications

- `GET /api/notifications`: List internal notifications.

## Webhooks

- `POST /api/webhooks/sendgrid/events`: SendGrid event webhook.
- `POST /api/webhooks/sendgrid/inbound`: SendGrid inbound parse webhook.
- `POST /api/webhooks/stripe`: Stripe webhook.

## Cron

- `GET /api/cron/send-batches`: Vercel Cron endpoint. Requires bearer `CRON_SECRET`.
