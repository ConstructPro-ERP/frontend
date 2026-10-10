# [DDP-50] feat(quotations): implement quotation search, pagination, and accessibility enhancements

**Issue:** #50  
**Assignee:** @me  
**Repository:** `frontend`  
**Labels:** `epic:ui-frontend`, `epic:integration`, `feat`, `accessibility`  
**Priority:** P1  
**Sprint:** Sprint 7 – Integration & UX  
**Phase:** Development  
**Base Branch:** `develop`  
**Working Branch:** `feature/50-quotation-controls-and-accessibility`

---

## 1. User Story

- **As a** sales or management user,
- **I want to** search, filter, and paginate through quotations and interact with accessible forms and modals,
- **So that** I can rapidly locate quotation records and efficiently navigate the full quotation workflow across desktop and mobile devices complying with WCAG 2.1 AA.

---

## 2. Background & Traceability

This issue addresses remaining gaps identified in Sprint 7 specification documents ([`quotation-list-controls.md`](./quotation-list-controls.md) and [`quotation-ux-accessibility.md`](./quotation-ux-accessibility.md)). While core quotation creation and lifecycle transitions are implemented, list navigation lacks server-backed search and pagination controls, and form/modal elements require WCAG 2.1 AA accessibility attributes.

- **SRS:** FR-003, FR-004, NFR-05, NFR-06, NFR-14
- **SDS:** Section 5.1.3 Quotations UI; Section 5.3 Accessibility Considerations
- **WCAG Target:** WCAG 2.1 Level AA

---

## 3. Acceptance Criteria

### AC1: Quotation Search (List Controls)

- **Given** quotation records exist in the system,
- **When** a user types a search term into the quotation search bar,
- **Then** the list is filtered to display matching records (by Lead ID, Customer Name, or Quotation ID).
- **When** no records match the search term,
- **Then** a clear empty state is rendered indicating no matching results for that query.

### AC2: Quotation Pagination (List Controls)

- **Given** quotation records spanning multiple pages,
- **When** a user navigates between pages or changes page limit,
- **Then** the corresponding page is requested and rendered with current page and total count displayed.
- **When** changing filter tabs or search queries,
- **Then** page index resets to 1.

### AC3: Form Accessibility & Semantic Inputs (UX & Accessibility)

- **Given** the quotation creation form and edit modal line items,
- **When** traversed using keyboard navigation or assistive technology (screen readers),
- **Then** all inputs (item name, quantity, unit price) have explicit labels or `aria-label` associations.
- **Then** remove item buttons have accessible `aria-label="Remove item"` descriptions.
- **Then** validation errors are linked to their corresponding inputs with `aria-describedby` and `aria-invalid`.

### AC4: Modal Focus Management (UX & Accessibility)

- **Given** quotation action dialogs (`EditQuotationModal`, `RejectQuotationModal`, `ConvertToProjectModal`),
- **When** the dialog opens,
- **Then** initial focus is placed on the first interactive element.
- **When** pressing `Tab` or `Shift+Tab`,
- **Then** focus remains trapped within the modal until dismissed or submitted.
- **When** closing via `Escape` or cancel,
- **Then** focus is restored to the initiating trigger button.

### AC5: Table Semantic Markup & Responsive Layout

- **Given** quotation line item tables,
- **When** rendered across viewports,
- **Then** table header cells use semantic `scope="col"` markup.
- **Then** line items remain cleanly scrollable and legible on mobile and tablet devices.

---

## 4. Test Requirements

- [x] Search query filtering and debounce/cancellation behavior.
- [x] Pagination controls: next/prev, total pages, page resets on filter change.
- [x] Empty state rendering when search matches 0 items.
- [x] Keyboard accessibility and focus management on modals.
- [x] Screen-reader accessible attributes on dynamic line items.

---

## 5. Definition of Done (DoD)

- [x] Code implemented and follows team coding standards.
- [x] All acceptance criteria are satisfied.
- [x] Unit / integration tests added/updated and passing (`npm test`).
- [x] Accessibility manual verification completed (keyboard tab order + screen reader markup).
- [x] Production build passes (`npm run build`).
- [ ] Pull request raised against `develop`.
- [ ] At least one peer review completed and all comments resolved.
- [ ] No secrets or credentials committed.
