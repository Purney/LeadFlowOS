# LeadFlow OS

LeadFlow OS is a Next.js App Router CRM for managing leads after a first call is booked, then carrying accounts through discovery, proposals, onboarding, delivery, maintenance, revenue, and portal collaboration.

Cold email outreach has been removed as an active product area. Campaigns, send batches, sending accounts, warmup governance, Mailgun webhooks, inbound reply automation, and cold/reply AI drafts are no longer part of the runtime app.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set the required local values in `.env.local`:

```env
NODE_ENV=development
APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
AUTH_SECRET=replace-with-a-long-random-secret
MONGODB_URI=<development MongoDB database>
```

Optional integration values can be left blank for local foundation work:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
SIGNATURE_PROVIDER_API_KEY=
SIGNATURE_PROVIDER_WEBHOOK_SECRET=
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If no owner exists, the app routes to `/signup`.

## Setup Notes

- Use a development MongoDB database that is separate from production.
- The first successful signup creates the initial organisation and owner user.
- Additional organisation signup is blocked unless `ALLOW_ADDITIONAL_ORG_SIGNUPS=true`.
- Manual lead creation defaults to `discovery_booked`, because leads enter the CRM after a first call is booked.
- Organisation settings define reusable lead custom fields for CRM context.
- Stripe, OpenAI, and signature-provider integrations are server-side adapter services. Missing credentials fail clearly when those integrations are called.
- Public/webhook ingress uses MongoDB-backed rate limiting.

## Useful Documentation

- [menu.md](menu.md): documentation map for future agents.
- [Architecture.md](Architecture.md): current system architecture and conventions.
- [docs/API.md](docs/API.md): route map.
- [docs/DataModel.md](docs/DataModel.md): model map and data rules.
- [docs/Integrations.md](docs/Integrations.md): external provider boundaries.
- [docs/Deployment.md](docs/Deployment.md): Vercel and production setup.
- [docs/ProductionSetup.md](docs/ProductionSetup.md): detailed production setup and environment variable guide.
- [docs/Security.md](docs/Security.md): security conventions and checklists.
- [docs/Testing.md](docs/Testing.md): test structure and commands.
- [docs/Runbook.md](docs/Runbook.md): operational debugging guide.
- [docs/Roadmap.md](docs/Roadmap.md): future work and technical debt.

## Quality Checks

Run these before handing off changes:

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

## Current App Areas

- `/dashboard`
- `/command`
- `/accounts`
- `/research`
- `/leads`
- `/sales`
- `/onboarding`
- `/execution`
- `/maintenance`
- `/ai`
- `/discovery`
- `/proposals`
- `/revenue`
- `/clients`
- `/portal`
- `/d/[publicSlug]`
- `/portal/[token]`

## Legacy Outreach Cleanup

After deploying the removal, run the explicit purge script against any environment that contains legacy outreach data:

```bash
npm run purge:outreach
```

The script deletes legacy outreach collections, removes old outbound settings and outreach-only lead fields, maps old `new`/`contacted`/`replied` leads to `discovery_booked`, and moves legacy `cold_outreach` lifecycle accounts to `proposal_sales`.

## Production Reminder

Before deploying to production, read [docs/ProductionSetup.md](docs/ProductionSetup.md), [docs/Deployment.md](docs/Deployment.md), and [docs/Security.md](docs/Security.md). Production must use separate MongoDB, Stripe, and webhook credentials from development.
