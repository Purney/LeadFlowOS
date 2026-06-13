# Implemented Stages

This document records what has been implemented so far. Keep this as history; use `docs/Roadmap.md` for future work.

## Phase 1

- Next.js App Router, TypeScript, Tailwind CSS, and shadcn-style local UI primitives.
- Auth.js credentials authentication with an organisation-aware session.
- First-owner signup flow that creates the initial organisation and owner user.
- MongoDB/Mongoose connection layer and Phase 1 models: `Organisation`, `User`, and `ActivityLog`.
- Live-capable SendGrid, Stripe, and OpenAI service adapters that fail clearly when credentials are missing.
- Vitest unit/integration test structure and a Playwright smoke spec.

## Phase 2

- Lead model with organisation scoping, lifecycle status, source, tags, notes, custom fields, and unique email deduplication per organisation.
- Lead CRUD APIs and UI at `/leads`.
- CSV import through a paste-in importer with duplicate and invalid-row reporting.
- Search and filtering by text, status, and tag.
- Dashboard total-lead metric backed by real lead data.
- Activity logging for lead create, update, delete, and import events.

## Phase 3

- Campaign model with organisation scoping, draft/active/paused/completed/archived statuses, service offer, goal, and ordered stages.
- Campaign enrollment model linking campaigns to leads with current step, next scheduled time, and deterministic A/B variant selection.
- Campaign APIs and UI at `/campaigns`.
- Multi-stage sequence builder with configurable delays, subject variants, body variants, and supported placeholders: `{{firstName}}`, `{{lastName}}`, `{{company}}`, and `{{website}}`.
- Personalisation preview against the current lead pool.
- Dashboard active-campaign metric backed by real campaign data.
- Activity logging for campaign create, update, and lead enrollment events.

## Phase 4

- Sending account model with provider, SendGrid sender ID, verification status, daily limit, warm-up status, active flag, and deliverability health fields.
- Send batch model with campaign, sending account, recipients, subject/body, A/B variant label, scheduled time, estimated volume, risk warnings, and approval statuses.
- Sending APIs and UI at `/sending`.
- Deliverability health scoring for SPF, DKIM, DMARC, tracking domain, unsubscribe support, bounce rate, and spam complaint rate.
- Warm-up recommendation logic for safe send volume.
- Manual send batch generation from enrolled campaign leads.
- Approval gate for generated batches: batches start as `pending_approval` and can be approved or rejected manually.
- Dashboard pending-approval metric backed by real send batch data.

## Phase 5

- Suppression model and UI with reasons for unsubscribed, bounced, spam report, manual suppression, existing client, and competitor.
- Email message and email event models for outbound attempts, inbound replies, and SendGrid event history.
- SendGrid outbound processing for approved send batches, with dry-run support.
- Event webhook route for delivery, open, click, bounce, unsubscribe, and spam report processing.
- Inbound parse webhook route for reply capture.
- Reply handling updates lead status to `replied` and pauses active campaign enrollments for that lead.
- Bounce, unsubscribe, and spam report events automatically create suppressions.
- Dashboard replies metric backed by inbound email messages.

## Phase 6

- AI draft model for cold email drafts and reply drafts.
- OpenAI-backed generation service with structured prompt builders.
- AI cold email generation from lead information, company, website, service offered, and campaign goal.
- AI reply drafting from lead context and conversation history.
- AI APIs at `/api/ai/cold-email` and `/api/ai/reply-draft`.
- AI workspace UI at `/ai`.
- Generated drafts are saved for manual review and are never sent automatically.
- Dashboard AI draft metric.

## Phase 7

- Discovery form and discovery response models.
- Internal discovery workspace at `/discovery`.
- Public discovery form links at `/d/[publicSlug]`.
- Form builder supporting short text, long text, number, date, single select, multi select, URL, and file metadata fields.
- Public response submission API with server-side answer validation.
- Responses can be linked to leads and update lead status to `qualified`.
- AI discovery summary generation from submitted answers.
- Discovery summaries are saved as AI drafts for manual review.
- Dashboard discovery response metric.

## Phase 8

- Proposal model with draft, sent, accepted, and rejected statuses.
- Structured proposal content for executive summary, identified problem, proposed solution, deliverables, assumptions, estimated timeline, and optional enhancements.
- Proposal versioning with content snapshots on edits.
- Proposal APIs and workspace UI at `/proposals`.
- Manual proposal creation and status tracking.
- AI proposal drafting from discovery responses.
- Dashboard proposal pipeline metric.
- Architecture prepared for future PDF export and electronic signatures.

## Phase 9

- Stripe customer, invoice, checkout session, and payment intent models.
- Stripe webhook verification route at `/api/webhooks/stripe`.
- Webhook processing for `customer.created`, `invoice.created`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed`, and `payment_intent.succeeded`.
- Revenue dashboard UI at `/revenue`.
- Monthly revenue, lifetime value, paid vs unpaid invoices, revenue trend, and revenue by customer metrics.
- Dashboard monthly revenue and revenue trend backed by Stripe invoice data.
- Payment received activity logging for paid invoices.

## Phase 10

- Client model with organisation scoping, lead conversion linkage, contacts, notes, and optional Stripe customer linkage.
- Project model with client linkage, type, status, estimated value, actual revenue, and delivery dates.
- Manual time entry model linked to client and project.
- Client conversion from existing leads marks the source lead as `won`.
- Client delivery workspace UI at `/clients`.
- Project creation and manual time logging workflows.
- Delivery metrics for clients, active projects, time by client/project, and effective hourly revenue.
- Dashboard time-logged metric backed by real time entries.

## Phase 11

- Secure client portal access model using hashed public tokens.
- Internal client portal workspace at `/portal`.
- Public client portal pages at `/portal/[token]`.
- Onboarding task model and creation workflow.
- Signature request model, internal request workflow, and public signing endpoint.
- PDF-ready export model that generates proposal/client HTML snapshots for later binary PDF rendering.
- Portal metrics for active links, open onboarding tasks, open signatures, and generated exports.
- Dashboard open-signature metric backed by real signature requests.

## Phase 12

- Portal message model for internal and client-authored collaboration.
- Internal portal message workflow and public client message submission.
- Kickoff onboarding automation that creates a standard client/project checklist.
- Downloadable PDF route for internal exports and token-scoped public portal exports.
- Lightweight binary PDF renderer for generated export snapshots.
- External signature provider adapter shell with explicit credential validation.
- Signature requests can be flagged for external provider delivery without changing the core workflow.
- Dashboard client-message metric backed by real portal messages.

## Prompt Audit Hardening

- Internal notification model and unread dashboard metric.
- Notification fanout for pending send approvals, replies, discovery submissions, accepted proposals, payments, and webhook failures.
- MongoDB-backed rate limiting for public form, portal, signing, and webhook ingress routes.
- Scheduled job helper for due approved send batches in `src/jobs/send-batch-jobs.ts`.
- Send-batch generation guards for suppressed leads, replied/won/lost leads, existing clients, inactive accounts, and warm-up/daily volume limits.

## Phase 13

- Vercel cron configuration in `vercel.json` for due approved send batches.
- Protected `/api/cron/send-batches` endpoint using `CRON_SECRET`.
- MongoDB-backed persistent rate limiting for public and webhook ingress routes.
- Security headers configured in `next.config.ts`.
- Cron route runtime, duration, and preferred-region hints for Vercel Functions.
- Persistent rate-limit bucket model with TTL cleanup.
- Follow-up hardening for rich HTML sanitization, atomic rate limits, first-owner setup locking, cross-tenant reference validation, bounded cron processing, and aggregation-backed metrics.

## Phase 14

- Unified account lifecycle vocabulary for `client_research`, `cold_outreach`, `proposal_sales`, `onboarding_payment`, `solution_execution`, and `maintenance`.
- `LifecycleAccount` model that can link leads, clients, proposals, Stripe customer IDs, ownership, next actions, stage, status, tags, and activity timestamps.
- `LifecycleTimelineEvent` model for cross-module account history.
- `lifecycle-service` for account creation, stage movement, metrics, recent timeline, lead sync, client sync, and project-driven execution advancement.
- Leads now create/update lifecycle accounts during create, update, and import workflows.
- Client creation/conversion links accounts into onboarding/payment, and project creation advances linked accounts into solution execution.
- Authenticated account APIs at `/api/accounts` and `/api/accounts/[accountId]/stage`.
- Account lifecycle command center at `/accounts`, plus dashboard lifecycle metric and sidebar navigation.
- Unit and integration coverage for lifecycle helpers, lifecycle account service behavior, lead sync, client conversion, and project advancement.

## Phase 15

- Dedicated client research stage before cold outreach.
- `ClientResearch` model for target account research, ICP fit score, priority, status, firmographics, decision-maker notes, current provider, competitors, pain hypotheses, opportunity ideas, positive/negative signals, outreach angle, next action, checklist, and AI summary.
- Research creation syncs into a Phase 14 lifecycle account at `client_research`.
- Research updates keep linked lifecycle account fit score, next action, status, notes, and tags current.
- Checklist updates create lifecycle timeline events.
- AI research summary generation stores a `research_summary` AI draft and writes the summary back onto the research record.
- Authenticated research APIs at `/api/research`, `/api/research/[researchId]`, `/api/research/[researchId]/checklist`, and `/api/research/[researchId]/summary`.
- Client research workspace at `/research` with creation form, research metrics, fit scoring, checklist controls, and AI summary actions.
- Dashboard research metric and sidebar navigation.
- Unit and integration coverage for research validation, prompts, lifecycle sync, checklist updates, metrics, and AI summary persistence.

## Phase 16

- Dedicated proposal and sales pipeline between outreach/discovery and onboarding/payment.
- `Deal` model for opportunities with lifecycle account, lead/proposal/client links, stage, status, value, probability, expected close date, next action, notes, won/lost reasons, and timestamps.
- `SalesTask` model for deal follow-up tasks with due dates and completion state.
- Sales stages: discovery booked, discovery complete, proposal drafted, proposal sent, negotiation, won, and lost.
- Deal creation creates or links a lifecycle account in `proposal_sales`.
- Won deals move linked lifecycle accounts to `onboarding_payment`; lost deals mark lifecycle status as lost.
- Weighted pipeline metrics, stage counts, open tasks, and overdue task counts.
- Authenticated sales APIs at `/api/deals`, `/api/deals/[dealId]`, `/api/deals/[dealId]/tasks`, and `/api/sales-tasks/[taskId]`.
- Sales pipeline workspace at `/sales` with deal creation, pipeline metrics, stage counts, won/lost actions, and open follow-up tasks.
- Dashboard active-deals metric and sidebar navigation.
- Unit and integration coverage for sales stages, validation, lifecycle sync, weighted metrics, won transitions, and task completion.

## Phase 17

- Dedicated onboarding and payment handoff workflow for won deals.
- `OnboardingHandoff` model linking deal, client, project, portal access, signature request, payment gate, onboarding task count, status, and kickoff notes.
- Handoff creation converts or creates the client, links the won deal to that client, optionally creates a planned project, optionally creates portal access, optionally creates a signature request, and optionally runs onboarding task automation.
- Payment gate tracks `not_required`, `pending`, `paid`, and `failed` without calling Stripe from the UI workflow.
- Handoffs keep lifecycle accounts in `onboarding_payment` with blocked status while kickoff payment is pending.
- Authenticated handoff APIs at `/api/handoffs` and `/api/handoffs/[handoffId]`.
- Onboarding workspace at `/onboarding` with won-deal handoff creation, payment gate actions, readiness actions, and handoff metrics.
- Dashboard onboarding-handoff metric and sidebar navigation.
- Unit and integration coverage for handoff validation, won-deal conversion, onboarding asset creation, portal token issuance, payment metrics, and handoff state updates.

## Phase 18

- Dedicated solution execution workspace after onboarding.
- Project execution fields for health, progress percentage, client-visible status summary, and internal status notes.
- `ExecutionMilestone` model for project milestones with status, due date, order, and completion tracking.
- `ExecutionTask` model for internal delivery tasks with assignee, status, due date, milestone link, and completion tracking.
- `Deliverable` model for client-facing deliverables with URL, status, and delivery timestamp.
- `execution-service` for scoped project progress updates, execution metrics, milestone creation, task creation, deliverable creation, lifecycle timeline events, and activity logging.
- Authenticated execution APIs at `/api/execution/projects/[projectId]`, `/api/execution/milestones`, `/api/execution/tasks`, and `/api/execution/deliverables`.
- Solution execution workspace at `/execution` with project progress controls, milestone/task/deliverable creation, metrics, project health, and delivery queue.
- Public portal now shows client-visible project progress, milestones, and approved/delivered deliverables.
- Dashboard execution-task metric and sidebar navigation.
- Unit and integration coverage for execution validation, project progress, milestones, tasks, deliverables, and metrics.
