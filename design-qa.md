# 社区固定工位申请 Design QA

## Evidence

- WeChat simulator map state: `output/design-qa/community-fixed-desk-flow/map-state.png`
- WeChat simulator application state: `output/design-qa/community-fixed-desk-flow/application-state.png`
- Screenshot pixels: `688 × 1486`
- Simulator viewport: `344 × 743` CSS pixels
- State: Community tab with synthetic fixed-desk availability injected after the production API response, because the new migration and API have not been deployed.

## Findings

- No actionable P0, P1, or P2 mismatch remains in the requested fixed-desk flow.
- Unassigned fixed desks use a dashed blue treatment and the explicit label `可申请固定`; they are visually distinct from green bookable desks.
- An assigned fixed desk replaces the seat code emphasis with the assignee avatar while retaining a small desk code for orientation.
- The application area clearly explains long-term occupancy, equipment move-in, active release, and public profile consent.
- The fixed-desk section does not use a colored vertical bar and follows the existing Community tab card, radius, spacing, and typography system.

## Interaction Checks

- WeChat automation loaded the page with no runtime exceptions.
- Five synthetic unassigned desks rendered as application options, while one synthetic assigned desk rendered an avatar.
- Tapping `F01` selected it, scrolled to the application section, and displayed the consent control and submit action.
- Tapping the assigned avatar navigated to `pages/profile/shared/index` with the assignee handle.
- Miniapp TypeScript checking and the Next.js production build passed.

## Data-State Checks

- The new migration was executed in a disposable Supabase PostgreSQL 17 container.
- The smoke flow passed: submit request → approve → create unique assignment → reject a competing request → active release → reopen the desk for a new request.
- The production migration remains pending and was not applied during QA.

final result: passed
