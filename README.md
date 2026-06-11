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

Phase 4 adds sending accounts, multiple domains, deliverability health, warm-up tracking, and manual send batch approval.

Later phases add SendGrid webhooks, suppression management, AI drafting, discovery forms, proposals, Stripe revenue tracking, client conversion, projects, time tracking, a client portal, onboarding automation, signatures, and PDF generation.
