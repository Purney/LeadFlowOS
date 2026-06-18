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

## Organisation Settings

- `GET /api/organisation/settings`: Return organisation-level lead custom field definitions and outbound email settings.
- `PATCH /api/organisation/settings`: Update lead custom field definitions, global signature, booking link, and positive-reply auto-response settings.

## Account Lifecycle

- `GET /api/accounts`: List/search/filter unified lifecycle accounts.
- `POST /api/accounts`: Create a manually researched lifecycle account.
- `PATCH /api/accounts/[accountId]/stage`: Move a scoped account to another business lifecycle stage.

## Client Research

- `GET /api/research`: List target account research records.
- `POST /api/research`: Create a research record and linked lifecycle account.
- `PATCH /api/research/[researchId]`: Update scoped research and sync lifecycle account fields.
- `PATCH /api/research/[researchId]/checklist`: Complete or reopen a research checklist item.
- `POST /api/research/[researchId]/summary`: Generate and store an AI research summary.

## Sales Pipeline

- `GET /api/deals`: List scoped deals.
- `POST /api/deals`: Create a deal and linked lifecycle account when needed.
- `PATCH /api/deals/[dealId]`: Update deal stage/status/details.
- `POST /api/deals/[dealId]/tasks`: Create a follow-up task for a deal.
- `PATCH /api/sales-tasks/[taskId]`: Update a sales task status.

## Onboarding Handoffs

- `GET /api/handoffs`: List onboarding/payment handoffs.
- `POST /api/handoffs`: Create a handoff from a won deal, optionally creating client, project, portal access, onboarding tasks, and signature request.
- `PATCH /api/handoffs/[handoffId]`: Update handoff status, payment gate, or kickoff notes.

## Solution Execution

- `PATCH /api/execution/projects/[projectId]`: Update project health, progress percentage, client-visible summary, and internal status note.
- `POST /api/execution/milestones`: Create a project milestone.
- `POST /api/execution/tasks`: Create an internal project execution task.
- `POST /api/execution/deliverables`: Create a client-facing deliverable record.

## Maintenance

- `POST /api/maintenance/plans`: Create a client maintenance plan.
- `POST /api/maintenance/tickets`: Create a support ticket.
- `POST /api/maintenance/tasks`: Create a recurring maintenance task.

## Campaigns

- `GET /api/campaigns`: List campaigns.
- `POST /api/campaigns`: Create campaign.
- `PATCH /api/campaigns/[campaignId]`: Update campaign.
- `POST /api/campaigns/[campaignId]/enrollments`: Enroll leads.

Campaign copy supports standard lead tokens, organisation custom-field tokens, and spintax. Exact validation is in `src/validation/campaign.ts`; rendering helpers are in `src/utils/personalisation.ts` and `src/utils/spintax.ts`.

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

Outbound settings are managed through `/api/organisation/settings`, not the sending-account routes. Send batch generation stores approval previews plus original templates for send-time per-recipient rendering.

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

- `POST /api/webhooks/mailgun/events`: Mailgun event webhook.
- `POST /api/webhooks/mailgun/inbound`: Mailgun inbound route webhook.
- `POST /api/webhooks/stripe`: Stripe webhook.

## Cron

- `GET /api/cron/send-batches`: Vercel Cron endpoint. Requires bearer `CRON_SECRET`.
