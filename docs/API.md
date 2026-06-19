# API

All private API routes require an authenticated session unless noted otherwise. Services must scope data by `session.user.organisationId`.

## Leads And Settings

- `GET /api/leads`: list/search/filter leads.
- `POST /api/leads`: create one lead or import CSV leads depending on request body mode.
- `PATCH /api/leads/[leadId]`: update a scoped lead.
- `DELETE /api/leads/[leadId]`: delete a scoped lead.
- `GET /api/organisation/settings`: return organisation-level lead custom field definitions.
- `PATCH /api/organisation/settings`: update organisation-level lead custom field definitions.

Manual lead creation defaults to `discovery_booked`.

## Lifecycle And CRM

- `GET /api/lifecycle/accounts`: list lifecycle accounts.
- `POST /api/lifecycle/accounts`: create lifecycle account.
- `PATCH /api/lifecycle/accounts/[accountId]`: update lifecycle account.
- `POST /api/lifecycle/accounts/[accountId]/stage`: move lifecycle stage.
- `POST /api/lifecycle/sync-leads`: sync existing leads into lifecycle accounts.
- `GET /api/sales/deals`: list deals.
- `POST /api/sales/deals`: create deal.
- `PATCH /api/sales/deals/[dealId]`: update deal.
- `GET /api/sales-tasks`: list sales tasks.
- `POST /api/sales-tasks`: create sales task.
- `PATCH /api/sales-tasks/[taskId]`: update sales task.

## Research, Discovery, And Proposals

- `GET /api/research`: list research records.
- `POST /api/research`: create research record.
- `PATCH /api/research/[researchId]`: update research record.
- `POST /api/research/[researchId]/summary`: generate AI research summary.
- `GET /api/discovery/forms`: list discovery forms.
- `POST /api/discovery/forms`: create discovery form.
- `PATCH /api/discovery/forms/[formId]`: update discovery form.
- `POST /api/discovery/responses/[responseId]/summary`: generate AI discovery summary.
- `GET /api/proposals`: list proposals.
- `POST /api/proposals`: create proposal or generate one from discovery.
- `PATCH /api/proposals/[proposalId]`: update proposal.

Public discovery:

- `GET /api/public/discovery/[publicSlug]`: fetch published discovery form.
- `POST /api/public/discovery/[publicSlug]/responses`: submit discovery response.

## Delivery, Revenue, And Portal

- `GET /api/clients`: list clients.
- `POST /api/clients`: create client or convert lead to client.
- `GET /api/projects`: list projects.
- `POST /api/projects`: create project.
- `PATCH /api/projects/[projectId]`: update project.
- `GET /api/revenue/invoices`: list invoices.
- `POST /api/revenue/invoices`: create invoice.
- `POST /api/webhooks/stripe`: Stripe webhook.
- `GET /api/portal-messages`: list portal messages.
- `POST /api/portal-messages`: create portal message.
- `GET /api/public/portal/[token]`: fetch public portal.
- `POST /api/public/portal/[token]/messages`: create public portal message.
- `POST /api/signature-requests`: create signature request.
- `PATCH /api/signature-requests/[requestId]`: update signature request.
- `POST /api/public/portal/[token]/signatures/[requestId]`: sign public request.
- `POST /api/pdf-exports`: create PDF export.
- `GET /api/pdf-exports/[exportId]/download`: download private PDF export.
- `GET /api/public/portal/[token]/pdf-exports/[exportId]/download`: download portal PDF export.

## Removed Outreach APIs

Campaigns, sending accounts, send batches, suppressions, Mailgun webhooks, and cold/reply AI routes have been removed. Use `npm run purge:outreach` to delete legacy data after deploying the removal.
