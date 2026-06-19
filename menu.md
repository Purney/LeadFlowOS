# LeadFlow OS Documentation Menu

Start here when you need project context. This file points to the markdown document that contains the information you are looking for.

## Core Orientation

- [README.md](README.md): Getting started, quality checks, current app areas, and the legacy outreach purge command.
- [Architecture.md](Architecture.md): System architecture, source layout, service boundaries, tenancy rules, deployment shape, and extension points.

## Specialist References

- [docs/API.md](docs/API.md): Internal, public, webhook, and download route map with auth expectations.
- [docs/DataModel.md](docs/DataModel.md): Mongoose model groups, relationships, ownership fields, indexes, and data integrity rules.
- [docs/Integrations.md](docs/Integrations.md): Stripe, OpenAI, signature provider, and future integration conventions.
- [docs/Deployment.md](docs/Deployment.md): Vercel deployment, environment variables, MongoDB Atlas, Stripe/signature webhooks, and production checklist.
- [docs/ProductionSetup.md](docs/ProductionSetup.md): Detailed production setup guide.
- [docs/Security.md](docs/Security.md): Authentication, tenant isolation, public routes, webhook verification, rate limiting, sanitization, and security checklists.
- [docs/Testing.md](docs/Testing.md): Test commands, test structure, integration patterns, MongoMemoryServer cleanup rules, and E2E notes.
- [docs/Runbook.md](docs/Runbook.md): Operational debugging guide.
- [docs/Roadmap.md](docs/Roadmap.md): Future work, technical debt, hardening priorities, and likely next phases.
- [docs/Phase20CommandCenter.md](docs/Phase20CommandCenter.md): Command center aggregate, next-best-action rules, and verification coverage.
- [docs/ImplementedStages.md](docs/ImplementedStages.md): Historical implementation notes, including the outreach removal.

## Quick Lookup

- Need to add a model? Read [Architecture.md](Architecture.md), then [docs/DataModel.md](docs/DataModel.md), then [docs/Testing.md](docs/Testing.md).
- Need to add an API route? Read [docs/API.md](docs/API.md) and [docs/Security.md](docs/Security.md).
- Need to deploy or configure Vercel? Read [docs/ProductionSetup.md](docs/ProductionSetup.md), then [docs/Deployment.md](docs/Deployment.md).
- Need to work on Stripe, OpenAI, or signatures? Read [docs/Integrations.md](docs/Integrations.md).
- Need to fix production behavior? Read [docs/Runbook.md](docs/Runbook.md).
- Need to understand future plans? Read [docs/Roadmap.md](docs/Roadmap.md).
- Need security guidance before changing public routes, HTML rendering, auth, or webhooks? Read [docs/Security.md](docs/Security.md).
- Need to change command-center actions? Read [docs/Phase20CommandCenter.md](docs/Phase20CommandCenter.md), then [Architecture.md](Architecture.md).
