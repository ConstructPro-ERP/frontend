# Person 2 frontend Sprint 8 verification ? issue #54

Repository: `ConstructPro-ERP/frontend`

Branch: `sprint8/54-person2-quotation-quality`

Base: `develop`

Date: 2026-10-12

## Scope and resulting behavior

This frontend hardening follows the Sprint 8 action plan and backend verification for issue #117. It adds no tax/discount features or unsupported backend statuses.

- Decimal half-up calculations use integer arithmetic before rounding. Unit prices and totals retain cents in live previews and cards. Form validation matches backend whole-number quantity, two-decimal price, integer bounds, and Decimal(12,2) limits.
- Only ADMIN and SALES_MANAGER see write controls. Unknown statuses fail closed; approved/converted edits are locked. MANAGER is no longer an accepted quotation-write alias.
- Submission uses PATCH `/quotations/:id/submit`, direct approval uses PATCH `/direct-approve`, conversion uses PATCH `/approve`, and revision/rejection use existing routes. The unsupported SENT filter and `/send` request are removed.
- Response normalization supports backend decimal strings. Conversion must return a real matching quotation/project ID and a valid project status. No project IDs or converted states are invented from malformed responses.
- Only ALREADY_CONVERTED triggers an authoritative quotation refresh. Unrelated 409 conflicts remain actionable errors. A failed refresh does not manufacture project linkage.
- Server filtering/pagination sends page and limit and uses backend counts. This fixes silently limiting the visible dataset to the backend's first page.
- Synchronous guards prevent repeated create, approve, revise, submit, edit, reject, convert, and PDF actions while pending. Creation disables automatic network/5xx replay through the existing shared client's request-level retry counter because the backend creation endpoint has no idempotency key. Authentication refresh remains handled by the shared client. Ambiguous conversion failures require refresh/retry; the backend retains its linked-project recovery.
- PDF opening reserves a tab during the click, removes its opener, accepts only HTTP(S) URLs without embedded credentials, and closes the tab on generation failure. Popup blocking receives an actionable message.
- Failed list/lead requests no longer substitute invented demo records. Real server IDs remain the only selectable lead records.
- Conversion requires a valid project-manager or target-project UUID, rejects invalid dates, accepts zero budgets, and labels fields accessibly. The modal focus timer no longer steals focus after the user starts interacting.
- The shared `src/lib/axios.ts` remains unchanged, as required by AGENTS.md. All backend calls use that client.

## Local validation

Baseline: 76 existing Node tests passed before changes.

Final behavior suite: **99 tests pass across 6 files**. Existing Node suite: **76 tests pass**. TypeScript checking, changed-file ESLint, changed-file formatting, and the optimized Next.js production build pass.

Measured quotation modules: **95.47% lines**, **94.76% statements**, **95.69% functions**, **87.65% branches**. Critical monetary arithmetic and role/state policy each reach **100% branches**. Every measured file exceeds 80% line coverage. Coverage includes the dashboard, lead picker, all quotation modals, focus hook, utilities, and quotation service adapters; it is not whole-repository coverage.

| Module                        | Line coverage | Branch coverage |
| ----------------------------- | ------------- | --------------- |
| LeadSelectDropdown.tsx        | 84.44%        | 54.23%          |
| QuotationsDashboardClient.tsx | 91.81%        | 80.55%          |
| quotationUtils.ts             | 100%          | 96.59%          |
| useModalFocusTrap.ts          | 100%          | 83.33%          |
| ConvertToProjectModal.tsx     | 93.15%        | 95.12%          |
| EditQuotationModal.tsx        | 98.41%        | 90.56%          |
| RejectQuotationModal.tsx      | 96.87%        | 96.42%          |
| quotationActions.ts           | 100%          | 100%            |
| quotationMoney.ts             | 100%          | 100%            |
| projectConversionApi.ts       | 100%          | 100%            |
| quotationItemsApi.ts          | 100%          | 50%             |
| quotationsApi.ts              | 100%          | 100%            |

Repeatable commands (Node 22):

```sh
npm ci
npm test
npm run test:quotation-quality
npm run typecheck
npm run build
npm audit --omit=dev
npm audit
```

Focused coverage gates require 80% overall lines/statements/functions, 80% quotation UI/service lines, and 90% critical monetary/policy branches. CI publishes `coverage/quotation-quality` as `frontend-quotation-quality-coverage` and runs on `sprint8/**` pushes and PRs to develop/main. The HTML report is `coverage/quotation-quality/index.html`; JSON, LCOV, and a text summary are also produced.

Tests run real React components in jsdom with mocked network responses. API adapter tests use a mocked shared Axios client. They validate behavior and contracts locally; they do not constitute live browser/staging/backend verification. Production build prerendered all 22 existing routes successfully.

## Test register inputs

| Suite                | Verified behavior                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logic.spec.ts`      | Decimal boundaries, validation, status/role matrix, safe PDF URLs, normalization, error handling                                                     |
| `api.spec.ts`        | Query pagination/filtering, decimal strings, lifecycle routes, verified conversion payloads, malformed response rejection, creation replay options   |
| `dashboard.spec.tsx` | Complete rendered lifecycle; locked/read-only controls; repeated clicks; PDF tab/failures; real pagination/search; authoritative conversion recovery |
| `modals.spec.tsx`    | Required conversion fields, UUIDs, zero budget, unrelated 409 conflicts, edit/reject failures and duplicate guards                                   |
| `leads.spec.tsx`     | Real lead selection and no synthetic fallback IDs                                                                                                    |
| `focus.spec.tsx`     | Initial focus, both Tab directions, busy Escape handling, prevention of delayed focus theft                                                          |

## Security and release limits

- `npm audit --omit=dev`: **0 vulnerabilities**.
- Full audit: **5 high development-tool findings**, all in the existing `eslint-config-next ? @next/eslint-plugin-next ? fast-glob/micromatch/braces` path. npm recommends a forced major downgrade of eslint-config-next; this was not applied. The production gate passes, but the all-dependency zero-high gate remains open until the toolchain is remediated/reviewed.
- `/dashboard/projects` is an existing placeholder; there is no `/dashboard/projects/[id]` detail route in develop. Converted quotation links now point to the existing projects route with the verified `projectId` query instead of a missing route. The placeholder does not consume that ID or show the project. Full project presentation/automatic navigation remains a coordinated Person 3 release dependency. Do not claim an end-to-end live project dashboard handoff is complete.
- Backend issue #117 must be deployed with the documented role/route contracts. Tax/discount fields and sales-representative assigned-record access are absent from that backend; this frontend does not simulate them.
- Shared-client retry configuration is implementation-dependent. If its retry policy changes, revisit the creation request option and add true backend idempotency before enabling automatic replay.
- No staging URL/login was supplied. No staging deployments, seeds, demo rehearsals, live PDFs, migrations, or panel deliverables were performed. Preserve user-owned local planning files and the pre-existing implementation-guide deletion.

## Staging/demo checklist

- [ ] Record frontend/backend deployment SHAs, CI results, staging URL, and test accounts.
- [ ] Create a quotation for a real qualified lead; verify cents in browser, API, database, and PDF.
- [ ] Verify revision ? draft ? submit ? approval ? conversion with realistic records.
- [ ] Confirm ADMIN/SALES_MANAGER writes and PROJECT_MANAGER/ACCOUNTANT read-only behavior, plus expired sessions and 401/403 API responses.
- [ ] Verify repeated clicks and ambiguous request recovery create no duplicate projects/quotations.
- [ ] Download/open real PDFs, including long descriptions, popup blocking, unavailable generation, and cached URLs after status changes.
- [ ] Verify search/filter/page changes with more than 20 quotations; record list/detail/conversion timings under representative data.
- [ ] Complete the project dashboard handoff once the Person 3 project UI exists.
- [ ] Prepare real lead/draft/approved/converted demo records; rehearse the team handoff.
- [ ] Export coverage and test-register evidence into the team's required PDFs and rerun release-candidate smoke checks.

Keep issue #54 open until the remaining release checks and cross-module dependencies are verified.
