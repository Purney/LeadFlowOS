# LeadFlow OS Documentation Menu

Start here when you need project context. This file points to the markdown document that contains the information you are looking for.

## Core Orientation

- [Architecture.md](Architecture.md): System architecture, source layout, service boundaries, tenancy rules, deployment shape, and extension points.
- [README.md](README.md): Getting started, local setup, quality checks, current app areas, and links to the rest of the documentation set.

## Specialist References

- [docs/Security.md](docs/Security.md): Authentication, tenant isolation, public routes, webhook verification, rate limiting, sanitization, and security checklists.
- [docs/Deployment.md](docs/Deployment.md): Vercel deployment, environment variables, MongoDB Atlas, cron, webhook setup, and production checklist.
- [docs/DataModel.md](docs/DataModel.md): Mongoose model groups, relationships, ownership fields, indexes, and data integrity rules.
- [docs/API.md](docs/API.md): Internal, public, webhook, cron, and download route map with auth expectations.
- [docs/Testing.md](docs/Testing.md): Test commands, test structure, integration patterns, MongoMemoryServer cleanup rules, and E2E notes.
- [docs/Integrations.md](docs/Integrations.md): SendGrid, Stripe, OpenAI, signature provider, and future integration conventions.
- [docs/Runbook.md](docs/Runbook.md): Operational procedures for incidents, cron, webhooks, email sending, secrets, and common debugging paths.
- [docs/ImplementedStages.md](docs/ImplementedStages.md): Completed phase history, including Phase 13 Vercel functionality and the security/performance hardening pass.
- [docs/Roadmap.md](docs/Roadmap.md): Future work, technical debt, hardening priorities, and likely next phases.

## Quick Lookup

- Need to add a model? Read [Architecture.md](Architecture.md), then [docs/DataModel.md](docs/DataModel.md), then [docs/Testing.md](docs/Testing.md).
- Need to add an API route? Read [docs/API.md](docs/API.md) and [docs/Security.md](docs/Security.md).
- Need to deploy or configure Vercel? Read [docs/Deployment.md](docs/Deployment.md).
- Need to work on SendGrid, Stripe, OpenAI, or signatures? Read [docs/Integrations.md](docs/Integrations.md).
- Need to fix production behavior? Read [docs/Runbook.md](docs/Runbook.md).
- Need to know what has already been built? Read [docs/ImplementedStages.md](docs/ImplementedStages.md).
- Need to understand future plans? Read [docs/Roadmap.md](docs/Roadmap.md).
- Need security guidance before changing public routes, HTML rendering, auth, or webhooks? Read [docs/Security.md](docs/Security.md).
