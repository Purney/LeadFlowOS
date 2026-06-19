# Implemented Stages

This document is now a compact implementation history.

## Current Product

- Next.js App Router CRM with Auth.js, MongoDB/Mongoose, Stripe, OpenAI, and optional signature provider support.
- Lead CRUD/import with custom CRM fields and default `discovery_booked` workflow.
- Lifecycle account spine across research, proposal/sales, onboarding/payment, execution, and maintenance.
- Client research, discovery forms, proposal workflows, client conversion, revenue, portal, signatures, PDF exports, execution, maintenance, and command center.
- AI support remains for research summaries, discovery summaries, and proposal drafting.

## Outreach Removal

Cold outreach was removed as an active product area. The removal deleted campaigns, campaign enrollments, sending accounts, send batches, Mailgun webhooks, warmup governance, automatic positive-reply handling, suppressions, cold email AI drafts, reply AI drafts, and related UI/API/tests.

Use `npm run purge:outreach` to delete legacy outreach data and remap old lead/lifecycle states.
