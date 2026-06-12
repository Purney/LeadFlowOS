# Data Model

LeadFlow OS uses Mongoose models in `src/models`.

## Model Conventions

Tenant-owned models should include:

- `organisationId`
- `createdAt`
- `updatedAt`
- `createdByUserId` where an internal user caused the record

Queries should generally include `organisationId` unless the model is infrastructure-only or a public-token lookup.

## Identity And Audit

`Organisation`

- Business account container.
- Created during first-owner signup.

`User`

- Belongs to an organisation.
- Includes name, email, password hash, and role.

`SetupLock`

- Singleton lock for safe first-owner setup.

`ActivityLog`

- Append-only audit/activity feed.
- Important actions create activity records.

`Notification`

- Internal notification records created from selected activity events.

## CRM

`Lead`

- Prospect record.
- Unique email per organisation.
- Tracks lifecycle status, source, tags, notes, and custom fields.

`Client`

- Converted customer record.
- May reference original `leadId`.
- Stores contacts, notes, and optional Stripe customer ID.

## Campaigns And Sending

`Campaign`

- Contains campaign metadata and embedded sequence steps.
- Step fields include delays, subject variants, and body variants.

`CampaignEnrollment`

- Links campaigns to leads.
- Tracks current step, status, next scheduled time, and assigned A/B variants.

`EmailAccount`

- Sending identity and deliverability state.
- Tracks provider, domain, verification status, daily limit, warm-up status, active flag, and health fields.

`SendBatch`

- Manual approval unit for outbound sending.
- Stores recipients, rendered sample subject/body, scheduled time, risk warnings, and status.

`Suppression`

- Email suppression list.
- Reasons include unsubscribed, bounced, spam report, manual suppression, existing client, and competitor.

## Email History

`EmailMessage`

- Outbound and inbound email records.
- Links to lead, campaign, send batch, and email account where known.

`EmailEvent`

- Provider event history from SendGrid.
- Tracks delivery, open, click, bounce, unsubscribe, spam reports, and raw event payload.

## AI

`AiDraft`

- Stores AI-generated cold emails, replies, discovery summaries, and proposal-related drafts.
- Drafts require manual review and are not automatically sent.

## Discovery And Proposals

`DiscoveryForm`

- Internal form definition.
- Public link is served by slug.

`DiscoveryResponse`

- Submitted answers for a discovery form.
- Can link to a lead.

`Proposal`

- Structured proposal document.
- Tracks status and content versions.

## Revenue

`StripeCustomer`

- Stripe customer mirror.

`StripeInvoice`

- Stripe invoice mirror.
- Used for revenue metrics.

`StripeCheckoutSession`

- Stripe checkout session mirror.

`StripePaymentIntent`

- Stripe payment intent mirror.

## Delivery

`Project`

- Linked to client.
- Tracks type, status, estimated value, actual revenue, and dates.

`TimeEntry`

- Manual time entry linked to client and project.
- Used for time and effective hourly revenue metrics.

## Portal

`PortalAccess`

- Hashed public portal token.
- Links to a client.
- Supports expiry, revocation, and last viewed timestamp.

`PortalMessage`

- Internal/client-authored portal collaboration message.

`OnboardingTask`

- Client/project onboarding task.

`SignatureRequest`

- Internal or public signature request.
- Can be signed through the public portal.
- Prepared for external provider metadata.

`PdfExport`

- Sanitized HTML document snapshot.
- Used for public/internal portal display and lightweight PDF downloads.

## Infrastructure

`RateLimitBucket`

- Shared persistent rate-limit bucket.
- TTL index expires old buckets.

## Data Integrity Rules

When adding or updating references:

- Check referenced records belong to the current organisation.
- For project-scoped data, check `projectId` belongs to the same client when `clientId` is also present.
- Do not trust raw IDs from request bodies.
- Prefer service-layer validation before writes.

## Metric Rules

Dashboards should use MongoDB aggregations for large collections.

Avoid loading all documents for:

- Revenue metrics.
- Time/project metrics.
- Notification counts.
- Campaign/send metrics.

