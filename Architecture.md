# LeadFlow OS Architecture

LeadFlow OS is a Next.js 16 App Router CRM. Leads enter the system after a first call is booked, then move through research, proposal/sales, onboarding/payment, execution, maintenance, revenue, clients, and portal collaboration.

Cold outreach is no longer an active subsystem. Campaigns, sending accounts, send batches, Mailgun webhooks, warmup governance, automatic reply handling, and cold/reply AI drafts have been removed from the app.

## Runtime Shape

- Next.js App Router lives under `src/app`.
- Route handlers live under `src/app/api/**/route.ts`.
- Shared UI lives under `src/components`.
- Mongoose models live under `src/models`.
- Business logic lives under `src/services`.
- Validation lives under `src/validation`.
- Tests live under `src/tests`.

The app uses Auth.js for sessions, MongoDB/Mongoose for persistence, Stripe for revenue, OpenAI for research/discovery/proposal assistance, and optional signature provider credentials for signing workflows.

## Core Domains

- Auth and tenancy: users belong to one organisation. Server-side services scope all tenant data by `organisationId`.
- Leads: manually added or imported CRM records. Manual leads default to `discovery_booked`.
- Lifecycle accounts: operating spine across `client_research`, `proposal_sales`, `onboarding_payment`, `solution_execution`, and `maintenance`.
- Research: target-account context, fit scores, checklist progress, opportunity angles, and AI summaries.
- Sales: deals, sales tasks, stages, weighted pipeline, and follow-up tracking.
- Discovery and proposals: public discovery forms, responses, AI proposal drafting, and proposal lifecycle.
- Onboarding, execution, maintenance: handoff, projects, deliverables, support tickets, retainers, renewals, and delivery health.
- Revenue: Stripe customers, invoices, and revenue metrics.
- Portal: client portal access, messages, tasks, signatures, and PDF downloads.
- Command center: aggregated operating metrics and next-best actions across CRM and delivery domains.

## Lead And Lifecycle Flow

1. A lead is manually added after a first call is booked.
2. The lead defaults to `discovery_booked`.
3. Lead sync creates or updates a lifecycle account in `proposal_sales`.
4. Sales/discovery/proposal work moves the account toward onboarding and delivery.
5. Client conversion links the lead/client and moves the lifecycle account into `onboarding_payment`.

Legacy `new`, `contacted`, `replied`, and `cold_outreach` values are handled by `npm run purge:outreach`.

## API And Security Conventions

- Use route handlers in `src/app/api`.
- Authenticate private app routes with `auth()`.
- Validate inputs with Zod schemas before service calls.
- Enforce organisation scoping in services, especially when accepting ids such as `leadId`, `clientId`, `proposalId`, or `projectId`.
- Public and webhook routes use persistent rate limiting.
- Provider secrets are read through `src/lib/env.ts`.

## Current Routes

Private app routes include dashboard, command, accounts, research, leads, sales, onboarding, execution, maintenance, AI summaries, discovery, proposals, revenue, clients, and portal.

Public routes include discovery forms under `/d/[publicSlug]` and client portals under `/portal/[token]`.

## Legacy Outreach Cleanup

The one-off script `scripts/purge-outreach-data.mjs` deletes legacy outreach collections, removes old outbound settings and outreach-only lead fields, maps old lead statuses to `discovery_booked`, and moves legacy `cold_outreach` lifecycle accounts to `proposal_sales`.
