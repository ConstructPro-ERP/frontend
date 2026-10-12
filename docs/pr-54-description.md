# PR title

Sprint 8: Harden frontend quotation calculations, permissions, and conversion workflow

# PR description

## Changes

Quotation approval used the conversion route, currency displays discarded cents, the frontend paginated only the first backend response page, and invalid conversion responses could fabricate project IDs. Read-only users could also see edit/revision actions, and outages could substitute demo data as live records.

This change aligns lifecycle routes and statuses with backend issue #117, uses decimal-safe money calculations and backend-aligned validation, normalizes decimal-string responses, and enforces role/state controls. It adds synchronous repeated-action guards, prevents automatic replay of quotation creation through request options, verifies real conversion IDs, and refreshes authoritative linkage only for ALREADY_CONVERTED. PDF opening handles blocked popups, unsafe URLs, and generation failures. Lead/list failures preserve honest empty/error states.

A Vitest/jsdom suite covers the rendered create ? edit ? reject ? revise ? submit ? approve ? convert flow, calculation edges, API contracts, permissions, PDF failures, and keyboard focus. CI enforces focused coverage and publishes evidence.

## Validation

- 99 behavioral tests pass across 6 files; 76 existing Node tests pass.
- Quotation modules: 95.47% line coverage; 95.69% function coverage; critical money/policy branches: 100%.
- TypeScript, changed-file ESLint/format checks, and Next.js production build pass.
- Production dependency audit: 0 vulnerabilities. Full audit retains 5 high findings in the pre-existing ESLint toolchain.

## Remaining release checks

Live staging/browser/backend verification and team evidence packaging remain pending. The projects route in develop is a placeholder; a verified project ID is carried to the existing route, but full project-dashboard handoff requires the Person 3 UI. Backend role/route updates from #117 must be deployed. No tax/discount or sales-representative access features are introduced.

See `docs/person-2-frontend-sprint-8-verification.md` for evidence, coverage by file, contracts, and the staging/demo checklist.

Related to #54. Keep the issue open until all remaining release gates are verified.
