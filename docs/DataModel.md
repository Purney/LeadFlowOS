# Data Model

All tenant-owned records include `organisationId`. User-created records generally include `createdByUserId`.

## Organisation And Users

`Organisation`

- Stores organisation name, slug, and reusable lead custom field definitions.
- No outbound email settings are stored.

`User`

- Stores name, email, password hash, role, and organisation membership.

## CRM Spine

`Lead`

- Stores contact details, company, website, role, tags, notes, source, lifecycle status, and custom fields.
- Manual leads default to `discovery_booked`.
- Statuses are `discovery_booked`, `imported`, `qualified`, `discovery_sent`, `proposal_sent`, `won`, and `lost`.
- Email is unique per organisation.

`LifecycleAccount`

- Links leads, clients, proposals, owners, Stripe customers, next actions, tags, and account state.
- Stages are `client_research`, `proposal_sales`, `onboarding_payment`, `solution_execution`, and `maintenance`.
- `discovery_booked`, `qualified`, `discovery_sent`, and `proposal_sent` leads map to `proposal_sales`.

`LifecycleTimelineEvent`

- Records lifecycle movement and notable account events.

## Research, Sales, Discovery, And Proposals

`ClientResearch`

- Stores target-account context, fit score, checklist progress, pain hypotheses, opportunity ideas, opportunity angle, and AI summary.

`Deal` and `SalesTask`

- Store sales pipeline state, values, probabilities, next actions, and follow-up work.

`DiscoveryForm` and `DiscoveryResponse`

- Store configurable discovery forms and submitted responses.

`Proposal`

- Stores proposal content, status, public token/slug, linked lead/client, and acceptance state.

`AiDraft`

- Stores AI-generated `research_summary` and `discovery_summary` drafts.
- Legacy `cold_email` and `reply` draft records are removed by `npm run purge:outreach`.

## Delivery, Revenue, And Portal

`Client`

- Stores converted clients, contacts, notes, and optional Stripe linkage.

`Project`, `Deliverable`, `TimeEntry`

- Store delivery work, milestones, deliverables, and tracked time.

`MaintenancePlan`, `MaintenanceTask`, `SupportTicket`

- Store retainers, recurring maintenance, support issues, renewal dates, and risk.

`Invoice`, `Payment`

- Store Stripe-backed revenue data.

`PortalAccess`, `PortalMessage`, `SignatureRequest`, `PdfExport`

- Store client portal access, collaboration, signing, and downloadable exports.

## Removed Outreach Collections

Legacy campaign, campaign enrollment, sending account, send batch, email message, email event, and suppression collections are no longer used. The purge script deletes them and removes old outreach fields from leads and organisations.
