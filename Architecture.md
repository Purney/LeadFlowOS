# LeadFlow OS Architecture

This document describes the current architecture of LeadFlow OS so future changes can be made without rediscovering the system from scratch. It should be updated whenever module boundaries, deployment assumptions, data models, or security conventions change.

## System Overview

LeadFlow OS is a Next.js App Router application for managing the lifecycle from client research through cold outreach, proposal and sales work, onboarding and payment, solution execution, maintenance, and portal collaboration.

The app is built as a server-first internal tool:

- Next.js App Router and Route Handlers provide UI and API surfaces.
- Auth.js credentials auth provides organisation-aware JWT sessions.
- MongoDB is accessed through Mongoose models and server-side services.
- UI components call internal API routes for mutations and use server components for most read-heavy pages.
- External integrations use live-capable adapter services for Mailgun, Stripe, OpenAI, and future signature providers.
- Vercel is the target hosting platform, with Vercel Cron used for due approved send batches.
- Organisation settings define reusable lead custom fields, global outbound email signature, booking link, and positive-reply auto-response templates.

## Source Layout

```text
src/
  app/          Next.js routes, layouts, pages, and API route handlers
  components/   UI components and client-side forms
  hooks/        Reserved for reusable React hooks
  jobs/         Scheduled/background job helpers
  lib/          Cross-cutting infrastructure helpers
  models/       Mongoose schemas and model exports
  services/     Server-side business logic and integration adapters
  tests/        Vitest unit/integration tests and Playwright specs
  types/        Shared TypeScript domain types/enums
  utils/        Pure utility functions
  validation/   Zod schemas and inferred input types
```

Keep database access in `src/services` or route handlers that delegate immediately to services. Client components should not import models, services, or server-only helpers.

## Request Flow

Typical authenticated mutation flow:

1. Client component submits JSON to an API route.
2. API route calls `auth()` and rejects unauthenticated requests.
3. API route parses input with a Zod schema from `src/validation`.
4. API route passes `{ organisationId, userId }` into a service.
5. Service performs organisation-scoped Mongoose queries and writes.
6. Service creates activity records for important actions.
7. UI calls `router.refresh()` to reload server-rendered data.

Public routes exist for discovery forms and client portal access. They use public slugs or hashed portal tokens and must stay carefully scoped to the public entity being accessed.

## Authentication And Tenancy

Auth lives in `src/auth.ts`.

Session strategy:

- Auth.js JWT sessions.
- Credentials provider only for now.
- Session user includes `id`, `email`, `name`, `organisationId`, and `role`.

Roles:

- `owner`
- `admin`
- `member`

Role checks are not deeply enforced yet; current security relies mostly on authenticated access plus organisation scoping. Future permission work should centralize role checks rather than scattering conditionals across routes.

Tenant isolation:

- Most models include `organisationId`.
- Services must always query by `organisationId` for internal data.
- When updating references such as `clientId`, `projectId`, or `proposalId`, validate the referenced document belongs to the same organisation before writing it.

First owner signup:

- `createFirstOwner` uses `SetupLock` to avoid concurrent first-owner signup races.
- After initial setup, additional organisation creation is blocked unless `ALLOW_ADDITIONAL_ORG_SIGNUPS=true`.

## Data Layer

MongoDB access uses Mongoose through `src/lib/db.ts`. The connection helper caches the connection promise for serverless reuse.

Core model groups:

- Identity and audit: `Organisation`, `User`, `SetupLock`, `ActivityLog`, `Notification`
- Account lifecycle: `LifecycleAccount`, `LifecycleTimelineEvent`
- Research: `ClientResearch`
- Sales: `Deal`, `SalesTask`
- Onboarding handoff: `OnboardingHandoff`
- Solution execution: `ExecutionMilestone`, `ExecutionTask`, `Deliverable`
- Maintenance: `MaintenancePlan`, `SupportTicket`, `MaintenanceTask`
- CRM: `Lead`, `Client`
- Outreach: `Campaign`, `CampaignEnrollment`, `EmailAccount`, `SendBatch`, `Suppression`
- Email history: `EmailMessage`, `EmailEvent`
- AI: `AiDraft`
- Discovery and proposals: `DiscoveryForm`, `DiscoveryResponse`, `Proposal`
- Revenue: `StripeCustomer`, `StripeInvoice`, `StripeCheckoutSession`, `StripePaymentIntent`
- Delivery: `Project`, `TimeEntry`
- Portal: `PortalAccess`, `PortalMessage`, `OnboardingTask`, `SignatureRequest`, `PdfExport`
- Infrastructure: `RateLimitBucket`

Model conventions:

- Use `organisationId` on tenant-owned records.
- Use `createdByUserId` where an internal user caused the record.
- Use timestamps through Mongoose `{ timestamps: true }`.
- Add indexes for common filters: organisation, status, email, public slug/token, scheduled time.

## Service Layer

Services are the main business-logic boundary. They parse/validate inputs when useful, scope all DB operations, create activity logs, and hide implementation details from route handlers.

Important services:

- `auth-service`: first owner creation, credentials auth.
- `lead-service`: lead CRUD, import, dedupe, search/filter.
- `lifecycle-service`: unified account lifecycle, stage movement, account metrics, timeline events, and cross-module sync.
- `research-service`: target account research, ICP scoring, checklist progress, lifecycle sync, and AI research summaries.
- `sales-service`: deal pipeline, weighted sales metrics, follow-up tasks, and lifecycle stage transitions.
- `handoff-service`: won-deal onboarding/payment handoff orchestration, client/project/portal/signature setup, and payment gate tracking.
- `execution-service`: delivery health, project progress, milestones, tasks, deliverables, and portal-visible execution progress.
- `maintenance-service`: retainers, support tickets, recurring maintenance tasks, renewal signals, client health, and lifecycle maintenance sync.
- `campaign-service`: campaign CRUD, enrollment, A/B allocation.
- `sending-service`: email accounts, deliverability metrics, send batch generation and approval.
- `email-service`: approved batch processing, Mailgun events, inbound replies, and positive-reply booking auto-response handling.
- `suppression-service`: suppression CRUD and sendability checks.
- `ai-service`: cold email drafts, reply drafts.
- `discovery-service`: form builder, public submissions, AI summaries.
- `proposal-service`: proposal CRUD, versions, AI proposal generation.
- `revenue-service`: Stripe webhook processing and revenue metrics.
- `client-service`: client conversion, projects, time entries, delivery metrics.
- `portal-service`: portal access, messages, onboarding, signatures, PDF exports.
- `notification-service`: internal notifications and unread counts.

When adding a feature, prefer adding logic to a service first, then expose it through routes/UI.

## API Routes

Authenticated internal APIs live under `src/app/api/*`.

Public APIs:

- `/api/public/discovery/[publicSlug]`
- `/api/public/discovery/[publicSlug]/responses`
- `/api/public/portal/[token]/messages`
- `/api/public/portal/[token]/signatures/[requestId]`
- `/api/public/portal/[token]/pdf-exports/[exportId]/download`

Webhook APIs:

- `/api/webhooks/mailgun/events`
- `/api/webhooks/mailgun/inbound`
- `/api/webhooks/stripe`

Cron API:

- `/api/cron/send-batches`

Route conventions:

- Authenticate before internal access.
- Validate request bodies with Zod.
- Return `401` for missing auth, `400` for invalid input, `404` for missing scoped records.
- Avoid leaking stack traces or provider secrets in errors.
- Public and webhook routes should use rate limiting.

## UI Architecture

Authenticated app shell:

- `src/app/(app)/layout.tsx`
- Sidebar navigation for dashboard, accounts, research, leads, sales, onboarding, execution, maintenance, campaigns, sending, AI, discovery, proposals, revenue, clients, portal, and time.

Workspace pages:

- `/dashboard`
- `/accounts`
- `/research`
- `/leads`
- `/sales`
- `/onboarding`
- `/execution`
- `/maintenance`
- `/campaigns`
- `/sending`
- `/ai`
- `/discovery`
- `/proposals`
- `/revenue`
- `/clients`
- `/portal`

Public pages:

- `/d/[publicSlug]`
- `/portal/[token]`

Most pages are server components that load service data directly. Forms are client components in `src/components/*` and submit to API routes.

The `/accounts` workspace is the Phase 14 lifecycle command center. It presents the account spine across `client_research`, `cold_outreach`, `proposal_sales`, `onboarding_payment`, `solution_execution`, and `maintenance`.

The `/research` workspace is the Phase 15 client research stage. It captures target account context before outreach, including ICP fit score, checklist progress, pain hypotheses, opportunity ideas, outreach angle, and AI-generated research summaries.

The `/sales` workspace is the Phase 16 proposal and sales pipeline. It tracks deals from discovery booked through proposal, negotiation, won, and lost outcomes, with weighted pipeline metrics and follow-up tasks.

The `/onboarding` workspace is the Phase 17 onboarding and payment handoff. It converts won deals into client onboarding assets, portal access, task automation, signature requests, and payment-gated kickoff tracking.

The `/execution` workspace is the Phase 18 solution execution layer. It manages delivery health, project progress, milestones, internal tasks, deliverables, and client-visible portal progress.

The `/maintenance` workspace is the Phase 19 post-delivery layer. It tracks retainers, support tickets, recurring maintenance tasks, renewal/check-in dates, client health, and maintenance revenue signals.

The `/leads` workspace also owns organisation-level lead field settings. These definitions make custom lead fields appear alongside normal fields such as company and first name when creating or updating leads. Custom field keys become campaign tokens, for example `Project type` can be used as `{PROJECT_TYPE}`.

The `/campaigns` workspace is split into a campaign dashboard/list, `/campaigns/create`, individual campaign pages, and draft edit pages. Campaign subject/body variants support A/B testing, normal personalisation tokens, custom-field tokens, and deterministic spintax syntax such as `{{RANDOM | Hey | Hi | Hello}}`.

The `/sending` workspace owns outbound email settings. It captures a global signature, booking link, and positive-reply auto-response template used by inbound reply handling.

UI style:

- Local shadcn-style primitives in `src/components/ui`.
- Restrained internal-tool design.
- Cards are used for panels and repeated items.
- Keep dense operational views scannable.

## Integrations

Mailgun:

- Adapter: `src/services/mailgun-service.ts`
- Event webhook processes delivery/open/click/bounce/unsubscribe/spam events.
- Inbound webhook records replies, updates lead status, and pauses campaign enrollment.
- Positive inbound replies can trigger a configured booking-call auto-response. The attempt is stored as an outbound `EmailMessage`; provider failures are captured on the message instead of crashing inbound webhook processing.
- Suppressions are created automatically for bounce, unsubscribe, and spam report events.

Stripe:

- Adapter: `src/services/stripe-service.ts`
- Webhook route verifies Stripe signatures before processing.
- Revenue service handles customers, invoices, checkout sessions, payment intents, and dashboard metrics.

OpenAI:

- Adapter: `src/services/openai-service.ts`
- Prompt builders live in `src/utils/ai-prompts.ts`.
- AI drafts are stored for manual review; no AI output is automatically sent.

Signature provider:

- Adapter shell: `src/services/signature-provider-service.ts`
- Current internal signing flow works without external provider credentials.
- External provider mode validates credentials and fails clearly until a real SDK implementation is added.

## Jobs And Scheduling

Job helpers live in `src/jobs`.

Current jobs:

- `processDueApprovedSendBatches`
- `processDueApprovedSendBatchesGlobally`

Vercel Cron:

- Configured in `vercel.json`.
- Calls `/api/cron/send-batches` every 15 minutes.
- The route requires `Authorization: Bearer <CRON_SECRET>`.
- The route processes a bounded global set of due approved batches instead of scanning all organisations.

If send volume grows, replace the cron batch processor with a durable queue such as Trigger.dev, Inngest, QStash, or a dedicated worker.

## Security Conventions

Implemented:

- Auth.js credentials auth.
- Password hashing via `bcryptjs`.
- Organisation-scoped DB queries.
- Zod validation for inputs.
- Webhook secret/signature verification.
- MongoDB-backed rate limiting for public/webhook ingress.
- Security headers in `next.config.ts`.
- Hashed public portal tokens.
- Rich HTML sanitization for stored/rendered portal document snapshots.
- Audit/activity logging and notification fanout for important events.

Important rules for future changes:

- Never trust IDs from a request without checking the referenced document belongs to the current organisation.
- Never render stored HTML unless it has passed through `sanitizeRichHtml`.
- Never send campaign emails automatically from campaign creation. Emails must go through send batches and manual approval.
- Positive-reply auto-responses are the exception to manual campaign send approval. Keep their templates organisation-scoped, explicit, and easy to disable.
- Never call external providers directly from client components.
- Keep provider secrets server-only.
- Keep public portal access limited to token-scoped data.

## Performance Conventions

Current optimizations:

- Mongoose connection reuse in `src/lib/db.ts`.
- Dashboard revenue and delivery metrics use Mongo aggregations instead of loading all records.
- Cron send processing uses bounded due-batch queries.
- Public/webhook rate limiting uses a shared Mongo collection with TTL cleanup.

Performance rules for future changes:

- Prefer Mongo aggregation for dashboard metrics.
- Add pagination for lists before they can grow large.
- Avoid fetching all tenant records into memory for calculations.
- Keep Vercel Function work bounded.
- Use indexes when adding new high-cardinality filters.

Known areas for future improvement:

- Replace Mongo-backed rate limiting with Redis/Upstash if ingress volume increases.
- Add pagination to more list APIs and workspaces.
- Move large send processing to a durable queue if batch volume grows.
- Improve PDF rendering beyond the lightweight built-in renderer.

## PDF And Rich HTML

`PdfExport` stores sanitized HTML snapshots generated from proposal/client data. Public and internal download routes render those snapshots into lightweight binary PDFs.

Rich HTML is currently allowed only through a conservative allowlist in `src/utils/html.ts`.

If future features allow users to edit document HTML directly, keep sanitization at both write and render boundaries and add tests for any newly allowed tags/attributes.

## Testing

Test stack:

- Vitest for unit and integration tests.
- MongoMemoryServer for integration tests.
- Playwright for E2E smoke tests.

Commands:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

Integration tests that create first owners must clean up `SetupLock`, `Organisation`, and `User` between tests.

## Deployment

Target platform: Vercel.

Required production environment:

- `NODE_ENV=production`
- `APP_ENV=production`
- `NEXT_PUBLIC_APP_URL`
- `MONGODB_URI`
- `AUTH_SECRET`
- `AUTH_URL`
- `CRON_SECRET`
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `MAILGUN_WEBHOOK_SIGNING_KEY`
- `MAILGUN_API_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`

Optional:

- `OPENAI_MODEL`
- `ALLOW_ADDITIONAL_ORG_SIGNUPS`
- `SIGNATURE_PROVIDER_API_KEY`
- `SIGNATURE_PROVIDER_WEBHOOK_SECRET`

Development and production must use separate MongoDB databases, Stripe credentials, Mailgun credentials, and webhook endpoints.

## Future Extension Points

Good next areas:

- Role/permission middleware for owner/admin/member behavior.
- Client-authenticated portal accounts.
- Provider-specific electronic signature implementation and webhooks.
- Richer PDF layout renderer.
- Durable queue for email sending and AI jobs.
- File management and storage provider abstraction.
- CRM/calendar integrations.
- Advanced analytics and reporting.
## Phase 20 Command Center

The command center is implemented as a server-side aggregate in `src/services/command-service.ts`. It does not introduce persistent command records. Instead, it composes existing stage metrics and returns an ordered action list for the authenticated `/command` workspace.

Future command rules should usually be added to this service after the underlying stage service exposes the necessary metric or query. This keeps stage ownership clear and avoids duplicate reporting logic.
## Phase 21 Warmup Governance

Warmup governance lives in the existing sending domain. `src/utils/deliverability.ts` owns the shared policy for health score, warmup checklist, risk level, and recommended send volume. `src/services/sending-service.ts` applies those rules when listing sending accounts, reporting sending metrics, and generating approval batches.

Sending accounts persist readiness signals such as authentication, DNS, TLS, unsubscribe support, blocklist status, bounce rate, complaint rate, deferral rate, per-domain caps, target warmup volume, and reputation status. Batch generation enforces per-recipient-domain caps before manual approval.

This stage intentionally avoids fake warmup conversations. Operators should use real reputation signals and gradual volume controls before cold outreach scales.
