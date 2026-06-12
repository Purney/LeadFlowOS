# Roadmap

This document captures future work and technical debt beyond the current MVP foundation.

## Current State

Phases 1-14 are implemented as MVP/foundation slices:

- Foundation/auth/org/dashboard.
- Leads and CSV import.
- Campaign builder and enrollments.
- Sending accounts, deliverability, and manual send batches.
- SendGrid events, inbound replies, and suppressions.
- AI drafts.
- Discovery forms and summaries.
- Proposals.
- Stripe revenue tracking.
- Clients, projects, and time tracking.
- Client portal, onboarding, signatures, and PDF-ready exports.
- Portal collaboration, PDF downloads, and signature adapter shell.
- Vercel cron, persistent rate limiting, security headers, and deployment hardening.
- Unified account lifecycle across client research, cold outreach, proposal and sales, onboarding and payment, solution execution, and maintenance.

## High-Priority Future Work

- Role and permission enforcement for `owner`, `admin`, and `member`.
- Pagination for large workspaces and list APIs.
- Redis/Upstash rate limiting for high-traffic deployments.
- Durable queue for email sending and AI jobs.
- Provider-specific signature implementation and webhooks.
- Richer PDF rendering.
- Client-authenticated portal accounts.
- File upload/storage management.

## Security Roadmap

- Centralized permission helpers.
- Stricter CSP without unsafe inline/eval if feasible.
- CSRF review for any future cookie-based custom routes outside Auth.js conventions.
- Webhook replay/idempotency tracking.
- Secret rotation docs per provider.
- Audit-log export and retention policy.

## Performance Roadmap

- Add pagination to leads, campaigns, send batches, portal messages, notifications, invoices, time entries.
- Add database indexes as access patterns stabilize.
- Replace cron polling with queue-based job orchestration if send volume grows.
- Add dashboard cache/revalidation strategy if dashboard aggregations become expensive.

## Product Roadmap

- Dedicated client research workspace with enrichment, ICP scoring, research checklists, and AI research summaries.
- Formal deal/opportunity pipeline between outreach, discovery, proposals, and won/lost sales outcomes.
- Payment-gated onboarding templates and automated handoff workflows.
- Richer solution execution boards with milestones, deliverables, internal assignments, and client-facing progress.
- Maintenance plans, support tickets, renewal tracking, health scores, and expansion opportunities.
- Client portal accounts and login.
- Portal notifications and email alerts.
- Kanban/task boards.
- Calendar integrations.
- CRM integrations.
- AI meeting summaries.
- Proposal PDF templates.
- Signed document storage and audit trails.
- More complete analytics.

## Testing Roadmap

- Expand Playwright E2E coverage beyond smoke.
- Add route-level tests for public portal and webhooks.
- Add permission tests after role enforcement lands.
- Add load-oriented tests for cron/rate-limit behavior if traffic grows.

## Documentation Roadmap

- Add screenshots or diagrams for onboarding new contributors.
- Add decision records for major future architectural changes.
- Keep `menu.md` updated whenever new documentation files are added.
