# 社区双用途工位 Design QA

## Evidence

- WeChat simulator map state: `output/design-qa/community-fixed-desk-flow/map-state.png`
- WeChat simulator application state: `output/design-qa/community-fixed-desk-flow/application-state.png`
- Screenshot pixels: `688 × 1486`
- Simulator viewport: `344 × 743` CSS pixels
- State: Dual-purpose desk implementation completed; visual re-verification remains a release-stage check.

## Findings

- Every active, unassigned desk is both bookable by time window and eligible for a fixed-desk application.
- Green desks represent the dual-purpose state `可预约 / 可申请固定`; there is no separate unassigned fixed-desk category.
- An assigned fixed desk replaces the seat code emphasis with the assignee avatar while retaining a small desk code for orientation.
- The application area clearly explains long-term occupancy, equipment move-in, active release, and public profile consent.
- The fixed-desk section does not use a colored vertical bar and follows the existing Community tab card, radius, spacing, and typography system.

## Interaction Checks

- WeChat automation loaded the page with no runtime exceptions.
- The booking selection card provides a direct entry to apply to fix the selected desk.
- The fixed-desk application section lists every active, unassigned desk, including desks already booked in the currently viewed time window.
- Tapping the assigned avatar navigated to `pages/profile/shared/index` with the assignee handle.
- Miniapp TypeScript checking and the Next.js production build passed after this rule change.

## Data-State Checks

- Booking and fixed approval use the same resource advisory lock so they cannot race into conflicting states.
- Approval is rejected while the desk has a confirmed ongoing or future booking; existing bookings are never silently cancelled.
- Once approved, the booking RPC rejects the assigned desk until its owner or an administrator releases it.
- At least 6 active desks must remain unassigned and bookable.
- The migration and state-transition smoke flow passed in a disposable PostgreSQL 17 container with 30 dual-purpose desks and a verified maximum of 24 simultaneous fixed assignments.

final result: implementation and disposable-database verification passed
