# LeadFlow OS

LeadFlow OS is a Next.js App Router application for managing the lifecycle from lead capture through outreach, discovery, proposals, revenue, client delivery, and portal collaboration.

The project is currently implemented through Phase 19 as an MVP/foundation build. For architecture, implementation history, and future work, start with [menu.md](menu.md).

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
CRON_SECRET=replace-with-a-long-random-cron-secret
```

Optional integration values can be left blank for local foundation work:

```env
SENDGRID_API_KEY=
SENDGRID_WEBHOOK_SECRET=
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
- SendGrid, Stripe, OpenAI, and signature-provider integrations are server-side adapter services. Missing credentials fail clearly when those integrations are called.
- Vercel Cron uses `/api/cron/send-batches` and requires `CRON_SECRET`.
- Public/webhook ingress uses MongoDB-backed rate limiting.

## Useful Documentation

- [menu.md](menu.md): documentation map for future agents.
- [Architecture.md](Architecture.md): current system architecture and conventions.
- [docs/ImplementedStages.md](docs/ImplementedStages.md): complete implementation history.
- [docs/Roadmap.md](docs/Roadmap.md): future work and technical debt.
- [docs/Deployment.md](docs/Deployment.md): Vercel and production setup.
- [docs/Security.md](docs/Security.md): security conventions and checklists.
- [docs/API.md](docs/API.md): route map.
- [docs/DataModel.md](docs/DataModel.md): model map and data rules.
- [docs/Testing.md](docs/Testing.md): test structure and commands.
- [docs/Integrations.md](docs/Integrations.md): external provider boundaries.
- [docs/Runbook.md](docs/Runbook.md): operational debugging guide.

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
- `/d/[publicSlug]`
- `/portal/[token]`

## Production Reminder

Before deploying to production, read [docs/Deployment.md](docs/Deployment.md) and [docs/Security.md](docs/Security.md). Production must use separate MongoDB, Stripe, SendGrid, and webhook credentials from development.
> Current implementation status: LeadFlow OS is implemented through Phase 20, including the authenticated command center at `/command`.
