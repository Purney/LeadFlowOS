# LeadFlow OS

Phase 1 MVP foundation for an internal lead-flow, outreach, revenue, and delivery management system.

## Implemented in Phase 1

- Next.js App Router, TypeScript, Tailwind CSS, and shadcn-style local UI primitives.
- Auth.js credentials authentication with an organisation-aware session.
- First-owner signup flow that creates the initial organisation and owner user.
- MongoDB/Mongoose connection layer and Phase 1 models: `Organisation`, `User`, and `ActivityLog`.
- Live-capable SendGrid, Stripe, and OpenAI service adapters that fail clearly when credentials are missing.
- Vitest unit/integration test structure and a Playwright smoke spec.

## Implemented in Phase 2

- Lead model with organisation scoping, lifecycle status, source, tags, notes, custom fields, and unique email deduplication per organisation.
- Lead CRUD APIs and UI at `/leads`.
- CSV import through a paste-in importer with duplicate and invalid-row reporting.
- Search and filtering by text, status, and tag.
- Dashboard total-lead metric backed by real lead data.
- Activity logging for lead create, update, delete, and import events.

## Implemented in Phase 3

- Campaign model with organisation scoping, draft/active/paused/completed/archived statuses, service offer, goal, and ordered stages.
- Campaign enrollment model linking campaigns to leads with current step, next scheduled time, and deterministic A/B variant selection.
- Campaign APIs and UI at `/campaigns`.
- Multi-stage sequence builder with configurable delays, subject variants, body variants, and supported placeholders: `{{firstName}}`, `{{lastName}}`, `{{company}}`, and `{{website}}`.
- Personalisation preview against the current lead pool.
- Dashboard active-campaign metric backed by real campaign data.
- Activity logging for campaign create, update, and lead enrollment events.

## Implemented in Stage 4

- Sending account model with provider, SendGrid sender ID, verification status, daily limit, warm-up status, active flag, and deliverability health fields.
- Send batch model with campaign, sending account, recipients, subject/body, A/B variant label, scheduled time, estimated volume, risk warnings, and approval statuses.
- Sending APIs and UI at `/sending`.
- Deliverability health scoring for SPF, DKIM, DMARC, tracking domain, unsubscribe support, bounce rate, and spam complaint rate.
- Warm-up recommendation logic for safe send volume.
- Manual send batch generation from enrolled campaign leads.
- Approval gate for generated batches: batches start as `pending_approval` and can be approved or rejected manually.
- Dashboard pending-approval metric backed by real send batch data.

## Implemented in Phase 5

- Suppression model and UI with reasons for unsubscribed, bounced, spam report, manual suppression, existing client, and competitor.
- Email message and email event models for outbound attempts, inbound replies, and SendGrid event history.
- SendGrid outbound processing for approved send batches, with dry-run support.
- Event webhook route for delivery, open, click, bounce, unsubscribe, and spam report processing.
- Inbound parse webhook route for reply capture.
- Reply handling updates lead status to `replied` and pauses active campaign enrollments for that lead.
- Bounce, unsubscribe, and spam report events automatically create suppressions.
- Dashboard replies metric backed by inbound email messages.

## Implemented in Phase 6

- AI draft model for cold email drafts and reply drafts.
- OpenAI-backed generation service with structured prompt builders.
- AI cold email generation from lead information, company, website, service offered, and campaign goal.
- AI reply drafting from lead context and conversation history.
- AI APIs at `/api/ai/cold-email` and `/api/ai/reply-draft`.
- AI workspace UI at `/ai`.
- Generated drafts are saved for manual review and are never sent automatically.
- Dashboard AI draft metric.

## Implemented in Phase 7

- Discovery form and discovery response models.
- Internal discovery workspace at `/discovery`.
- Public discovery form links at `/d/[publicSlug]`.
- Form builder supporting short text, long text, number, date, single select, multi select, URL, and file metadata fields.
- Public response submission API with server-side answer validation.
- Responses can be linked to leads and update lead status to `qualified`.
- AI discovery summary generation from submitted answers.
- Discovery summaries are saved as AI drafts for manual review.
- Dashboard discovery response metric.

## Implemented in Phase 8

- Proposal model with draft, sent, accepted, and rejected statuses.
- Structured proposal content for executive summary, identified problem, proposed solution, deliverables, assumptions, estimated timeline, and optional enhancements.
- Proposal versioning with content snapshots on edits.
- Proposal APIs and workspace UI at `/proposals`.
- Manual proposal creation and status tracking.
- AI proposal drafting from discovery responses.
- Dashboard proposal pipeline metric.
- Architecture prepared for future PDF export and electronic signatures.

## Implemented in Phase 9

- Stripe customer, invoice, checkout session, and payment intent models.
- Stripe webhook verification route at `/api/webhooks/stripe`.
- Webhook processing for `customer.created`, `invoice.created`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed`, and `payment_intent.succeeded`.
- Revenue dashboard UI at `/revenue`.
- Monthly revenue, lifetime value, paid vs unpaid invoices, revenue trend, and revenue by customer metrics.
- Dashboard monthly revenue and revenue trend backed by Stripe invoice data.
- Payment received activity logging for paid invoices.

## Implemented in Phase 10

- Client model with organisation scoping, lead conversion linkage, contacts, notes, and optional Stripe customer linkage.
- Project model with client linkage, type, status, estimated value, actual revenue, and delivery dates.
- Manual time entry model linked to client and project.
- Client conversion from existing leads marks the source lead as `won`.
- Client delivery workspace UI at `/clients`.
- Project creation and manual time logging workflows.
- Delivery metrics for clients, active projects, time by client/project, and effective hourly revenue.
- Dashboard time-logged metric backed by real time entries.

## Implemented in Phase 11

- Secure client portal access model using hashed public tokens.
- Internal client portal workspace at `/portal`.
- Public client portal pages at `/portal/[token]`.
- Onboarding task model and creation workflow.
- Signature request model, internal request workflow, and public signing endpoint.
- PDF-ready export model that generates proposal/client HTML snapshots for later binary PDF rendering.
- Portal metrics for active links, open onboarding tasks, open signatures, and generated exports.
- Dashboard open-signature metric backed by real signature requests.

## Implemented in Phase 12

- Portal message model for internal and client-authored collaboration.
- Internal portal message workflow and public client message submission.
- Kickoff onboarding automation that creates a standard client/project checklist.
- Downloadable PDF route for internal exports and token-scoped public portal exports.
- Lightweight binary PDF renderer for generated export snapshots.
- External signature provider adapter shell with explicit credential validation.
- Signature requests can be flagged for external provider delivery without changing the core workflow.
- Dashboard client-message metric backed by real portal messages.

## Getting Started

Copy `.env.example` to `.env.local` and set at least:

- `MONGODB_URI`
- `AUTH_SECRET`
- `AUTH_URL=http://localhost:3000`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

Then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If no owner exists, the app routes to `/signup`.

## Quality Checks

```bash
npm run lint
npm run test
npm run build
```

Playwright is configured with:

```bash
npm run test:e2e
```

The E2E smoke test expects a running app and valid local environment.

## Roadmap

Future hardening can add provider-specific signature webhooks, richer PDF layout rendering, portal notifications, and client-authenticated accounts.
