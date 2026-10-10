# Sprint 7: Person 2 Frontend Implementation Task Breakdown

**Role:** Person 2 — Quotations and Project Conversion  
**Primary Ownership:** Quotation lifecycle from creation through approval and project conversion  
**Sprint Theme:** Connect, Complete, Integrate, and Polish  
**Source Plan:** [`docs/ConstructPro_Sprint7_Frontend_4_Person_Plan.pdf`](file:///c:/Users/minin/Documents/GitHub/frontend/docs/ConstructPro_Sprint7_Frontend_4_Person_Plan.pdf)

---

## 1. Executive Summary & Responsibility Overview

As **Person 2**, your primary responsibility in Sprint 7 is owning the **Quotation lifecycle and Project conversion** flow end-to-end on the frontend. This bridges the Sales pipeline (from Person 1's Leads) into Project Execution (Person 3's Projects) and provides financial data for downstream accounting (Person 4's Finance & KPIs).

### Core Responsibilities

- Connecting the Quotation Management page and detail views to real backend APIs.
- Replacing manual Lead ID string inputs with real Lead selection (dropdown/search).
- Polishing line item management (add, edit, delete, live `round2` calculation preview).
- Supporting all quotation lifecycle states: `Draft`, `Sent`, `Approved`, `Rejected`, `Revised`, and `Converted`.
- Implementing role-aware action controls (Admin / Sales Manager / Management permissions).
- Handling edge cases and error states (409 duplicate conversion, 404 missing lead, invalid state transitions, retry on backend unavailable).
- Providing on-demand PDF generation and download workflows.
- Creating the dedicated API service layer files (`quotationsApi.ts`, `quotationItemsApi.ts`, `projectConversionApi.ts`).

---

## 2. Gap Analysis: Current Repo Status vs. Sprint 7 Requirements

Based on an inspection of the current frontend repository:

| Feature Area               | Current Status in Repo                                                                                                                                                                                                              | Required for Sprint 7 (Person 2)                                                                                    | Gap / Action Needed                                                                                                                                                                                |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API Service Layer**      | Only `aiForecastingApi.ts`, `analyticsApi.ts`, `dashboardApi.ts`, `financeApi.ts` exist in [`src/services`](file:///c:/Users/minin/Documents/GitHub/frontend/src/services).                                                         | PDF explicitly requires `quotationsApi.ts`, `quotationItemsApi.ts`, and `projectConversionApi.ts`.                  | **Missing**: Must create these 3 service modules using [`src/lib/axios.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/lib/axios.ts) and decouple direct Axios calls from UI components. |
| **Lead Selection**         | In [`QuotationsDashboardClient.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/QuotationsDashboardClient.tsx), Lead ID is a manual text input (`<input placeholder="lead-2026-108" />`). | Implement lead selection when creating a quotation instead of manual ID entry.                                      | **Missing**: Replace text input with a Lead dropdown/combobox fetching qualified leads from backend with customer name & status display.                                                           |
| **Quotation Detail View**  | Quotations are displayed in cards within [`QuotationsDashboardClient.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/QuotationsDashboardClient.tsx).                                     | Real backend list and detail views.                                                                                 | **Incomplete**: Ensure full detail modal/drawer or expandable view displays all backend fields, timestamps, customer summary, and audit info.                                                      |
| **Quotation States**       | Types define `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `CONVERTED`.                                                                                                                                                      | PDF requires: `Draft`, `Sent`, `Approved`, `Rejected`, `Revised`, and `Converted`.                                  | **Needs alignment**: Add `SENT` state handling (send to client action) and formalize `REVISED` state handling and status badge styling.                                                            |
| **Approval vs Conversion** | "Convert to Project" directly triggers `PATCH /quotations/:id/approve`.                                                                                                                                                             | FE-07 (Approval UI) and FE-08 (Conversion UI) are separate issues.                                                  | **Needs refinement**: Provide explicit two-step capability (direct approval vs conversion to project) with role guards.                                                                            |
| **PDF Actions**            | Simple button triggers `GET /quotations/:id/pdf`.                                                                                                                                                                                   | PDF view & download actions with proper loading feedback and error handling.                                        | **Complete & Polish**: Integrate with document viewer/blob download and ensure reliable regeneration handling.                                                                                     |
| **Error & Retry States**   | Basic inline errors and prototype fallback exist.                                                                                                                                                                                   | Standardized retry mechanisms, 409 conflict handling, network failure banners, and field-level validation feedback. | **Needs Polish**: Add explicit "Retry" button when API fails and polish duplicate conversion handling.                                                                                             |

---

## 3. Detailed Work Breakdown by Issue (FE-05 to FE-08)

### **FE-05: Connect Quotation Management Page to Backend APIs**

_Branch:_ `feature/FE-05-quotation-api-integration`

#### What to Develop:

1. **Create Service File [`src/services/quotationsApi.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/services/quotationsApi.ts)**:
   - Encapsulate all Quotation HTTP calls using `apiClient` from [`src/lib/axios.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/lib/axios.ts).
   - Functions to implement:
     - `listQuotations(params?: { status?: string; leadId?: string; page?: number; limit?: number })`: Returns `Promise<QuotationListResponse>`
     - `getQuotationById(id: string)`: Returns `Promise<Quotation>`
     - `createQuotation(payload: CreateQuotationDto)`: Returns `Promise<Quotation>`
     - `updateQuotation(id: string, payload: UpdateQuotationInput)`: Returns `Promise<Quotation>`
     - `getQuotationPdf(id: string)`: Returns `Promise<{ pdfUrl: string }>`
2. **Implement Lead Selection in Quotation Creation Form**:
   - Create a Lead Picker component or fetch leads from `/leads` (collaborating with Person 1's lead endpoints).
   - Replace the manual `<input placeholder="lead-2026-108" />` with an accessible `<select>` or combobox showing:
     - Customer name, company/contact info, lead ID, and status (e.g., `QUALIFIED`).
   - If lead APIs are loading or empty, display appropriate loading and empty states with graceful fallback.
3. **Refactor [`QuotationsDashboardClient.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/QuotationsDashboardClient.tsx)**:
   - Replace inline `apiClient.get('/quotations...')` calls with `quotationsApi.listQuotations()`.
   - Add status filter tab switching, search by quotation ID / customer name, and refresh trigger.
   - Implement empty state ("No quotations found"), error state with "Retry" action, and backend unavailable fallback.

---

### **FE-06: Implement Quotation Item Form and Total Calculation UI**

_Branch:_ `feature/FE-06-quotation-items-ui`

#### What to Develop:

1. **Create Service File [`src/services/quotationItemsApi.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/services/quotationItemsApi.ts)** (if backend exposes granular item endpoints):
   - Support batch item update or individual item CRUD if exposed by the backend schema.
2. **Enhanced Line Item Management in Creation Form & [`EditQuotationModal.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/modals/EditQuotationModal.tsx)**:
   - Dynamic rows: Add row, delete row (with confirmation if populated), duplicate row.
   - Field validations:
     - Item name: Required, non-empty.
     - Quantity: Number > 0 (supports integer or decimal measurements).
     - Unit price: Number >= 0 (currency input).
     - Dynamic line total: Automatically computes `quantity * unitPrice` using `calculateLineItemAmount` with `round2` precision.
   - Automatic live quotation subtotal and grand total calculation preview.
3. **Input Polish**:
   - Currency symbol localization (USD / EUR / LKR according to ERP settings).
   - Clear inline validation messages for each invalid item field before form submission.
   - Disallow submission if items array is empty or contains zero/invalid amounts.

---

### **FE-07: Implement Quotation Approval, Rejection and Revision UI**

_Branch:_ `feature/FE-07-quotation-approval-ui`

#### What to Develop:

1. **Quotation Status Lifecycle Support**:
   - Ensure the UI handles and displays the complete lifecycle:
     - `DRAFT`: Editable, can submit for approval or send to client.
     - `SENT`: Sent to client, awaiting customer decision / manager sign-off.
     - `PENDING_APPROVAL`: Visible to Admin/Sales Manager, eligible for Approve or Reject.
     - `APPROVED`: Locked for editing, eligible for project conversion.
     - `REJECTED`: Locked, displays rejection reason notes, eligible for Revise.
     - `CONVERTED`: Final state, locked, links to converted project.
2. **Approval Action**:
   - Add dedicated "Approve Quotation" action for `ADMIN` and `SALES_MANAGER` roles.
   - Submits status change to `APPROVED` without immediately forcing project conversion.
3. **Rejection Workflow ([`RejectQuotationModal.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/modals/RejectQuotationModal.tsx))**:
   - Require a reason of at least 5 characters.
   - Calls `PATCH /quotations/:id/reject` via `quotationsApi`.
   - Updates card status to `REJECTED` and shows rejection notice banner.
4. **Revision Workflow**:
   - "Revise Quotation" action on `REJECTED` cards calls `PATCH /quotations/:id/revise`.
   - Transitions quotation back to `DRAFT`, unlocks editing, and updates status badge.
5. **Role-Based Guards**:
   - Verify permissions against user role stored in Redux (`auth.user.role`).
   - Only allow `ADMIN`, `MANAGER`, and `SALES_MANAGER` to perform approval/rejection.

---

### **FE-08: Implement Quotation-to-Project Conversion UI and PDF Action**

_Branch:_ `feature/FE-08-project-conversion-pdf-ui`

#### What to Develop:

1. **Create Service File [`src/services/projectConversionApi.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/services/projectConversionApi.ts)**:
   - `convertQuotationToProject(quotationId: string, payload: ConvertToProjectInput)`: Returns `Promise<ConvertToProjectResponse>`
   - Handles both:
     - New project creation (`projectName`, `startDate`, `budget`, `projectManagerId`).
     - Linking to existing project (`targetProjectId`).
2. **Project Conversion Modal ([`ConvertToProjectModal.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/modals/ConvertToProjectModal.tsx))**:
   - Pre-fills project name from customer name and budget from quotation total amount.
   - Dropdown selection of Project Managers (fetching users with role `PROJECT_MANAGER` or `MANAGER`).
   - Handles `409 Conflict` (`ALREADY_CONVERTED`): Displays informative notice and smoothly transitions quotation to `CONVERTED`.
   - On success: updates card status to `CONVERTED` and provides direct navigation link to `/dashboard/projects/[projectId]`.
3. **PDF Generation and View/Download Action**:
   - "Download PDF" / "View PDF" button on quotation cards and detail view.
   - Calls `quotationsApi.getQuotationPdf(quotation.id)`.
   - Shows spinner indicator (`isGeneratingPdf`) while backend document service renders the PDF.
   - Automatically opens in new tab or downloads via generated URL.

---

## 4. File Checklist for Person 2

### Files to Create (New):

- [ ] [`src/services/quotationsApi.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/services/quotationsApi.ts) — Full service for quotation CRUD, PDF, approve, reject, revise.
- [ ] [`src/services/quotationItemsApi.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/services/quotationItemsApi.ts) — Line item operations helper.
- [ ] [`src/services/projectConversionApi.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/services/projectConversionApi.ts) — Quotation-to-project conversion service.
- [ ] [`src/components/dashboard/quotations/LeadSelectDropdown.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/LeadSelectDropdown.tsx) — Lead selector replacing manual ID input.

### Files to Update / Refactor:

- [ ] [`src/types/quotation.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/types/quotation.ts) — Update quotation status enums (including `SENT`), DTO types, and filter parameters.
- [ ] [`src/components/dashboard/quotations/QuotationsDashboardClient.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/QuotationsDashboardClient.tsx) — Replace raw `apiClient` calls with service layer functions; embed lead selector; improve retry & loading states.
- [ ] [`src/components/dashboard/quotations/quotationUtils.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/quotationUtils.ts) — Add any missing status handlers and ensure error codes map cleanly.
- [ ] [`src/components/dashboard/quotations/modals/EditQuotationModal.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/modals/EditQuotationModal.tsx) — Refactor to use `quotationsApi.updateQuotation`.
- [ ] [`src/components/dashboard/quotations/modals/RejectQuotationModal.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/modals/RejectQuotationModal.tsx) — Refactor to use `quotationsApi.rejectQuotation`.
- [ ] [`src/components/dashboard/quotations/modals/ConvertToProjectModal.tsx`](file:///c:/Users/minin/Documents/GitHub/frontend/src/components/dashboard/quotations/modals/ConvertToProjectModal.tsx) — Refactor to use `projectConversionApi.convertQuotationToProject`.
- [ ] [`test/quotations-dashboard.test.mjs`](file:///c:/Users/minin/Documents/GitHub/frontend/test/quotations-dashboard.test.mjs) — Update and expand unit tests for new services and components.

---

## 5. Cross-Person Dependencies & Guidelines

1. **Rule from [`AGENTS.md`](file:///c:/Users/minin/Documents/GitHub/frontend/AGENTS.md):**
   - **Mandatory use of shared Axios client:** Always use `apiClient` from [`src/lib/axios.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/lib/axios.ts).
   - **Do NOT modify [`src/lib/axios.ts`](file:///c:/Users/minin/Documents/GitHub/frontend/src/lib/axios.ts)** under any circumstances.
2. **Dependency on Person 1 (Leads & Users):**
   - You need Person 1's lead listing API (`GET /leads`) for the lead selector dropdown. Coordinate on the Lead response contract (`id`, `customerName`, `status`, `phone`, `email`).
   - You need users with role `PROJECT_MANAGER` for the project manager assignment field in conversion.
3. **Dependency on Person 3 (Projects):**
   - Person 3 depends on your quotation conversion output to view and manage converted projects at `/dashboard/projects/[projectId]`.
4. **Dependency on Person 4 (Finance & Analytics):**
   - Converted quotations and quotation totals feed into Person 4's revenue KPI cards and forecasting models.

---

## 6. Sprint 7 Completion Criteria for Person 2

As defined in Section 10 of the Sprint 7 Plan:

- [x] **Sales Manager can create quotations from leads with line items and correct totals** (lead selector + dynamic items + `round2` calculation).
- [x] **Management can approve/reject quotations and convert approved quotations to projects** (role guards + modals + 409 conflict handling).
- [x] **Quotation PDF view and download actions operate reliably** (spinner indicator + open/download URL).
- [x] **Consistent loading, empty, error, and validation states** on the Quotation Management page.
- [x] **Frontend lint, format check, tests, and build pass cleanly** before PR merge.
