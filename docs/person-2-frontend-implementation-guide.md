# Person 2: Frontend Implementation Guide

## Quotations and Project Conversion Integration (Weeks 9–12)

This guide documents the frontend implementation tasks required for **Person 2 (Quotations & Project Conversion Integration)** in `ConstructPro-ERP/frontend`. All backend API endpoints, DTO validations, guards, seed datasets, and unit/E2E test suites are fully implemented and pushed to `backend`.

---

## Architecture & File Map

### Target Frontend Directory: `ConstructPro-ERP/frontend`

| File                                                                           | Purpose                                                | What to Modify / Add                                                                  |
| :----------------------------------------------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `src/components/dashboard/quotations/QuotationsDashboardClient.tsx`            | Main dashboard client component                        | Add `useEffect` to fetch list, add Edit/Reject/Revise/PDF/Convert handlers and modals |
| `src/components/dashboard/quotations/quotationUtils.ts`                        | Utilities, formatting, calculations                    | Add `round2` calculation helper, status badge helpers, error parsers                  |
| `src/types/quotation.ts`                                                       | TypeScript types & interfaces                          | Update quotation types to include `pdfUrl`, `projectId`, status enums, DTO inputs     |
| `src/components/dashboard/quotations/modals/EditQuotationModal.tsx` _(new)_    | Modal to edit draft quotation line items & notes       | Submits `PUT /quotations/:id`                                                         |
| `src/components/dashboard/quotations/modals/RejectQuotationModal.tsx` _(new)_  | Modal to prompt for required rejection reason          | Submits `PATCH /quotations/:id/reject`                                                |
| `src/components/dashboard/quotations/modals/ConvertToProjectModal.tsx` _(new)_ | Modal to enter project details upon quotation approval | Submits `PATCH /quotations/:id/approve`                                               |

---

## Detailed Implementation by Week

---

### Week 9: Quotation List, Details, Edit & Calculations

#### 1. Fetch Real Quotations on Page Load (`GET /quotations`)

- **Problem in current frontend:** The dashboard initializes state as `kind: "empty"` and only displays quotations created in that session or mock prototype data.
- **Backend Endpoint:** `GET /quotations?page=1&limit=20&status=...&leadId=...`
- **Response Shape:**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "leadId": "lead-uuid",
        "status": "PENDING_APPROVAL",
        "totalAmount": 150000.0,
        "pdfUrl": null,
        "projectId": null,
        "notes": "Sample notes",
        "createdAt": "2026-04-02T10:00:00.000Z",
        "items": [
          {
            "id": "item-uuid",
            "itemName": "Concrete",
            "quantity": 10,
            "unitPrice": 15000,
            "amount": 150000
          }
        ],
        "lead": { "customerName": "Skyline Heights", "status": "QUALIFIED" }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
  ```
- **Implementation Steps:**
  1. In `QuotationsDashboardClient.tsx`, add a `useEffect` hook on mount:
     ```tsx
     useEffect(() => {
       async function loadQuotations() {
         setQuotationsState({ kind: "loading" });
         try {
           const res = await apiClient.get<{
             items: Quotation[];
             total: number;
           }>("/quotations");
           if (res.data.items.length === 0) {
             setQuotationsState({ kind: "empty" });
           } else {
             setQuotationsState({ kind: "ready", quotations: res.data.items });
           }
         } catch (error) {
           setQuotationsState({
             kind: "error",
             message: "Failed to load quotations from server.",
           });
         }
       }
       loadQuotations();
     }, []);
     ```
  2. Add status filter tabs (`ALL`, `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `CONVERTED`) that pass `?status=...` query param.

#### 2. Edit Quotation UI (`PUT /quotations/:id`)

- **Backend Endpoint:** `PUT /quotations/:id`
- **Payload:**
  ```json
  {
    "notes": "Updated scope and terms",
    "items": [
      {
        "itemName": "Reinforced Concrete Foundation",
        "quantity": 15,
        "unitPrice": 12000
      }
    ]
  }
  ```
- **Business Rules:**
  - Quotations with status `APPROVED` or `CONVERTED` cannot be edited (backend returns `400 Bad Request` with `{ code: 'QUOTATION_LOCKED' }`).
  - Disable or hide the "Edit" button if `quotation.status === 'APPROVED' || quotation.status === 'CONVERTED'`.
- **Implementation Steps:**
  1. Add an "Edit Quotation" button on cards with status `DRAFT` or `PENDING_APPROVAL`.
  2. Clicking opens `EditQuotationModal` pre-populated with current `notes` and `items`.
  3. Allow adding/removing rows and recalculating totals in real time.
  4. On submit, call `await apiClient.put(`/quotations/${id}`, payload)` and replace the quotation in React state.

#### 3. Floating-Point Calculation Sync

- **Backend Precision Rule:** Backend calculates `round2(quantity * unitPrice)` with `Number.EPSILON`.
- **Implementation in `quotationUtils.ts`:**

  ```ts
  export function round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  export function calculateLineItemAmount(
    quantity: number,
    unitPrice: number,
  ): number {
    return round2(quantity * unitPrice);
  }

  export function calculateTotalAmount(
    items: Array<{ quantity: number; unitPrice: number }>,
  ): number {
    const total = items.reduce(
      (sum, item) => sum + round2(item.quantity * item.unitPrice),
      0,
    );
    return round2(total);
  }
  ```

---

### Week 10: Approval, Rejection & Revision UI + Error Handling

#### 1. Rejection Modal with Mandatory Reason (`PATCH /quotations/:id/reject`)

- **Backend Endpoint:** `PATCH /quotations/:id/reject`
- **Payload:**
  ```json
  {
    "reason": "Quotation exceeds customer budget limit by 15%."
  }
  ```
- **Validation:** `reason` must be a string with a minimum of 5 characters.
- **Role Guard:** Restricted to `ADMIN` and `SALES_MANAGER`.
- **Implementation Steps:**
  1. In `QuotationCard`, add a red **"Reject"** button visible when `quotation.status === 'PENDING_APPROVAL'` and user is Admin or Sales Manager.
  2. Clicking opens `RejectQuotationModal`.
  3. Render textarea for reason with client validation:
     - If `< 5` characters, disable submit and show: _"Rejection reason must be at least 5 characters long."_
  4. On submit:
     ```tsx
     const res = await apiClient.patch<Quotation>(
       `/quotations/${quotation.id}/reject`,
       { reason },
     );
     replaceQuotationInState(res.data);
     setFeedback({
       tone: "success",
       message: `Quotation ${quotation.id} has been rejected.`,
     });
     ```
  5. The card updates badge to `REJECTED` and shows the appended `[Rejection Reason]: ...` in the notes section.

#### 2. Revise Quotation Action (`PATCH /quotations/:id/revise`)

- **Backend Endpoint:** `PATCH /quotations/:id/revise`
- **Payload:** `{}` (empty body)
- **Status Transition:** Moves `REJECTED` &rarr; `DRAFT`.
- **Implementation Steps:**
  1. On quotation cards with status `REJECTED`, render a **"Revise Quotation"** button with a refresh icon.
  2. On click:
     ```tsx
     const res = await apiClient.patch<Quotation>(
       `/quotations/${quotation.id}/revise`,
     );
     replaceQuotationInState(res.data);
     setFeedback({
       tone: "info",
       message: `Quotation moved back to Draft. You can now edit line items and re-submit.`,
     });
     ```
  3. Card status changes to `DRAFT`, which automatically unlocks the **"Edit Quotation"** button!

#### 3. Status Transition Visuals & Structured Error Alerts

- **Status Badges:**
  - `DRAFT`: Gray badge (`bg-surface-container text-on-surface-muted`)
  - `PENDING_APPROVAL`: Amber badge (`bg-risk-medium-container text-risk-medium`)
  - `APPROVED`: Emerald badge (`bg-risk-low-container text-risk-low`)
  - `REJECTED`: Red badge (`bg-error-container text-error`)
  - `CONVERTED`: Blue / Primary badge (`bg-primary-soft text-primary`)
- **Standardized Backend Error Mapping:**
  ```tsx
  if (error instanceof ApiError) {
    switch (error.code) {
      case "INVALID_STATUS_TRANSITION":
        return setFeedback({
          tone: "error",
          message: "This quotation cannot transition to the requested status.",
        });
      case "QUOTATION_LOCKED":
        return setFeedback({
          tone: "error",
          message: "Approved or converted quotations cannot be edited.",
        });
      case "QUOTATION_REJECTED":
        return setFeedback({
          tone: "error",
          message:
            "Rejected quotations cannot be converted. Send for revision first.",
        });
      case "ALREADY_CONVERTED":
        return setFeedback({
          tone: "info",
          message: "This quotation has already been converted to a project.",
        });
      default:
        return setFeedback({
          tone: "error",
          message: error.message || "An unexpected error occurred.",
        });
    }
  }
  ```

---

### Week 11: PDF Download & Project Conversion Integration

#### 1. On-Demand PDF Generation & Download (`GET /quotations/:id/pdf`)

- **Problem in current frontend:** If `quotation.pdfUrl` is null, the button is disabled and permanently displays _"Preparing PDF..."_.
- **Backend Endpoint:** `GET /quotations/:id/pdf`
  - If `pdfUrl` already exists on the record, returns `{ "pdfUrl": "..." }`.
  - If `pdfUrl` is null, calls `DocumentClient` to generate the PDF, saves the URL in the database, and returns `{ "pdfUrl": "..." }`.
- **Implementation Steps:**
  1. Always keep the **"Download PDF"** button enabled.
  2. When clicked:

     ```tsx
     const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

     const handleDownloadPdf = async (quotation: Quotation) => {
       if (quotation.pdfUrl) {
         window.open(quotation.pdfUrl, "_blank", "noopener,noreferrer");
         return;
       }

       setIsGeneratingPdf(true);
       try {
         const res = await apiClient.get<{ pdfUrl: string }>(
           `/quotations/${quotation.id}/pdf`,
         );
         const pdfUrl = res.data.pdfUrl;
         replaceQuotationInState({ ...quotation, pdfUrl });
         window.open(pdfUrl, "_blank", "noopener,noreferrer");
       } catch (err) {
         setFeedback({
           tone: "error",
           message: "Failed to generate quotation PDF. Please try again.",
         });
       } finally {
         setIsGeneratingPdf(false);
       }
     };
     ```

  3. Show spinner icon while `isGeneratingPdf` is active.

#### 2. "Convert to Project" Modal & Duplicate Conversion Guard (`PATCH /quotations/:id/approve`)

- **Backend Endpoint:** `PATCH /quotations/:id/approve`
- **Payload Shape:**
  ```json
  {
    "projectName": "Lotus Villa Residential Phase 1",
    "startDate": "2026-11-01T00:00:00.000Z",
    "budget": 2200000.0,
    "projectManagerId": "user-uuid"
  }
  ```
  _(Or if linking to an existing project: `{ "targetProjectId": "project-uuid" }`)_
- **Response Shape (HTTP 200 OK):**
  ```json
  {
    "quotation": {
      "id": "...",
      "status": "CONVERTED",
      "projectId": "project-uuid"
    },
    "projectId": "project-uuid",
    "projectStatus": "ACTIVE"
  }
  ```
- **Duplicate Conversion Response (HTTP 409 Conflict):**
  ```json
  {
    "statusCode": 409,
    "code": "ALREADY_CONVERTED",
    "message": "Quotation has already been converted to a project."
  }
  ```
- **Implementation Steps:**
  1. Create `ConvertToProjectModal.tsx`:
     - Input: Project Name (pre-filled with lead customer name + project)
     - Input: Start Date (date picker)
     - Input: Budget (pre-filled with `quotation.totalAmount`)
     - Input: Project Manager (dropdown of users with `PROJECT_MANAGER` role)
  2. On submit:
     ```tsx
     try {
       const res = await apiClient.patch(
         `/quotations/${quotation.id}/approve`,
         payload,
       );
       replaceQuotationInState(res.data.quotation);
       setFeedback({
         tone: "success",
         message: `Project created successfully (ID: ${res.data.projectId}). Status: ${res.data.projectStatus}`,
       });
     } catch (error) {
       if (error instanceof ApiError && error.code === "ALREADY_CONVERTED") {
         setFeedback({
           tone: "info",
           message: `This quotation is already converted to a project.`,
         });
         replaceQuotationInState({ ...quotation, status: "CONVERTED" });
       }
     }
     ```
  3. In `QuotationCard`, when `status === 'CONVERTED'`, display a badge and a link button:
     - _"Converted to Project [projectId]"_ &rarr; navigates to `/dashboard/projects/[projectId]`.

---

### Week 12: Testing & Sprint 7 Live Demo Verification

Use the backend demo seed data to verify each scenario in the browser:

#### Run Backend Seed First:

```bash
# In backend directory:
npx ts-node prisma/seeds/quotation-demo.seed.ts
```

#### Test Scenarios in Frontend:

| Scenario                       | Lead            | Initial Status     | Action to Perform                                                   | Expected Result                                                 |
| :----------------------------- | :-------------- | :----------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------- |
| **1. Rejection Demo**          | Skyline Heights | `PENDING_APPROVAL` | Click **Reject**, enter reason: `"Budget exceeds allowance by 20%"` | Card updates to `REJECTED`, notes display reason                |
| **2. Revision Demo**           | Ocean Breeze    | `REJECTED`         | Click **Revise Quotation**                                          | Status resets to `DRAFT`, **Edit Quotation** button unlocks     |
| **3. Edit Demo**               | Ocean Breeze    | `DRAFT`            | Click **Edit Quotation**, change item price                         | Line item & total update instantly with 2-decimal precision     |
| **4. PDF Generation Demo**     | Lotus Villa     | `APPROVED`         | Click **Download PDF**                                              | Shows spinner, fetches/generates PDF, opens document in new tab |
| **5. Project Conversion Demo** | Lotus Villa     | `APPROVED`         | Click **Convert to Project**, fill name/manager                     | Creates Project, card updates to `CONVERTED` with Project link  |
| **6. 409 Conflict Demo**       | Skyline Heights | `CONVERTED`        | Attempt approval / conversion                                       | Displays informative banner: _"Already converted to Project"_   |

---

## TypeScript Definitions Reference

Ensure your frontend types in `src/types/quotation.ts` match the backend contracts:

```typescript
export type QuotationStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED";

export interface QuotationItem {
  id: string;
  quotationId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  leadId: string;
  quotationDate: string;
  status: QuotationStatus;
  totalAmount: number;
  pdfUrl: string | null;
  notes: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuotationItem[];
  lead?: {
    id: string;
    customerName: string;
    email: string;
    phone: string;
    status: string;
  };
}

export interface RejectQuotationInput {
  reason: string;
}

export interface UpdateQuotationInput {
  notes?: string;
  items?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface ConvertToProjectInput {
  projectName?: string;
  startDate?: string;
  projectManagerId?: string;
  budget?: number;
  targetProjectId?: string;
}
```
