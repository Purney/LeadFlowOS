# Phase 20 Command Center

Phase 20 introduces an internal command center that aggregates the operating signals created across the LeadFlow OS workflow.

## Scope

- Adds a server-side command service that composes metrics from lifecycle, research, outreach, sales, onboarding, execution, maintenance, revenue, and portal services.
- Adds prioritized next-best actions with `critical`, `warning`, and `info` severities.
- Adds an authenticated `/command` workspace for reviewing blockers, watch items, and operating snapshots.
- Adds a dedicated command workspace so urgent cross-stage issues are visible in one place.
- Keeps the command center aggregate-only for now. No persistent command model is introduced.

## Action Rules

The command service currently raises actions for:

- Due lifecycle activity on account records.
- Incomplete client research checklists.
- Pending send approvals.
- Overdue sales work.
- Payment-pending onboarding handoffs.
- Blocked or overdue execution work.
- Urgent or at-risk maintenance work.
- Upcoming maintenance renewals.
- Unread portal messages.

## Design Notes

The command center intentionally reuses existing stage services instead of introducing a second reporting data path. This keeps Phase 20 consistent with the current domain model and gives later phases a single place to add operating rules as new stages become richer.

## Verification

Phase 20 adds:

- Unit coverage for command areas and severity ordering.
- Integration coverage for command service maintenance-risk action generation.
