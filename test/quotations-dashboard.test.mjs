import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("quotations page renders the dedicated quotations dashboard client", () => {
  const pageSource = read("src/app/dashboard/quotations/page.tsx");

  assert.match(pageSource, /QuotationsDashboardClient/);
  assert.doesNotMatch(pageSource, /placeholder/i);
});

test("quotation types define full Person 2 schema and DTOs", () => {
  const typesSource = read("src/types/quotation.ts");

  assert.match(typesSource, /QuotationStatus/);
  assert.match(typesSource, /"DRAFT"/);
  assert.match(typesSource, /"PENDING_APPROVAL"/);
  assert.match(typesSource, /"APPROVED"/);
  assert.match(typesSource, /"REJECTED"/);
  assert.match(typesSource, /"CONVERTED"/);
  assert.match(typesSource, /pdfUrl:\s*string\s*\|\s*null/);
  assert.match(typesSource, /projectId:\s*string\s*\|\s*null/);
  assert.match(typesSource, /QuotationLeadSummary/);
  assert.match(typesSource, /RejectQuotationInput/);
  assert.match(typesSource, /UpdateQuotationInput/);
  assert.match(typesSource, /ConvertToProjectInput/);
  assert.match(typesSource, /ConvertToProjectResponse/);
});

test("quotation utilities implement floating-point round2 precision calculation sync", () => {
  const utilsSource = read(
    "src/components/dashboard/quotations/quotationUtils.ts",
  );

  assert.match(utilsSource, /function round2\(n:\s*number\):\s*number/);
  assert.match(utilsSource, /Number\.EPSILON/);
  assert.match(utilsSource, /calculateLineItemAmount/);
  assert.match(utilsSource, /calculateTotalAmount/);
});

test("quotation utilities expose filter tabs, status badges, and error parser", () => {
  const utilsSource = read(
    "src/components/dashboard/quotations/quotationUtils.ts",
  );

  assert.match(utilsSource, /quotationFilterTabs/);
  assert.match(utilsSource, /id:\s*"ALL"/);
  assert.match(utilsSource, /id:\s*"DRAFT"/);
  assert.match(utilsSource, /id:\s*"PENDING_APPROVAL"/);
  assert.match(utilsSource, /id:\s*"APPROVED"/);
  assert.match(utilsSource, /id:\s*"REJECTED"/);
  assert.match(utilsSource, /id:\s*"CONVERTED"/);

  assert.match(utilsSource, /getQuotationStatusBadgeClasses/);
  assert.match(utilsSource, /getQuotationStatusLabel/);
  assert.match(utilsSource, /getQuotationErrorMessage/);
  assert.match(utilsSource, /INVALID_STATUS_TRANSITION/);
  assert.match(utilsSource, /QUOTATION_LOCKED/);
  assert.match(utilsSource, /QUOTATION_REJECTED/);
  assert.match(utilsSource, /ALREADY_CONVERTED/);
});

test("quotation utilities support SALES_MANAGER, ADMIN, and MANAGER role guards", () => {
  const utilsSource = read(
    "src/components/dashboard/quotations/quotationUtils.ts",
  );

  assert.match(utilsSource, /canCreateQuotation/);
  assert.match(utilsSource, /canApproveQuotation/);
  assert.match(utilsSource, /canRejectQuotation/);
  assert.match(utilsSource, /SALES_MANAGER/);
  assert.match(utilsSource, /ADMIN/);
});

test("quotationsApi service encapsulates all Quotation HTTP calls using shared apiClient", () => {
  const serviceSource = read("src/services/quotationsApi.ts");

  assert.match(
    serviceSource,
    /apiClient\.get<[\s\S]*?>\(\s*"\/quotations"/,
  );
  assert.match(serviceSource, /`\/quotations\/\$\{id\}`/);
  assert.match(
    serviceSource,
    /apiClient\.post<Quotation>\("\/quotations",\s*\{/,
  );
  assert.match(
    serviceSource,
    /apiClient\.put<Quotation>\(\s*`\/quotations\/\$\{id\}`,/,
  );
  assert.match(
    serviceSource,
    /apiClient\.patch<[\s\S]*?>\(\s*`\/quotations\/\$\{id\}\/approve`/,
  );
  assert.match(
    serviceSource,
    /apiClient\.patch<Quotation>\(\s*`\/quotations\/\$\{id\}\/reject`/,
  );
  assert.match(
    serviceSource,
    /apiClient\.patch<Quotation>\(\s*`\/quotations\/\$\{id\}\/revise`/,
  );
  assert.match(
    serviceSource,
    /apiClient\.get<\{ pdfUrl: string \}>\(\s*`\/quotations\/\$\{id\}\/pdf`/,
  );
});

test("projectConversionApi encapsulates quotation to project conversion with typed response", () => {
  const serviceSource = read("src/services/projectConversionApi.ts");

  assert.match(
    serviceSource,
    /apiClient\.patch<[\s\S]*?>\(\s*`\/quotations\/\$\{quotationId\}\/approve`/,
  );
  assert.match(serviceSource, /convertQuotationToProject/);
  assert.match(serviceSource, /projectStatus:\s*projResponse\.projectStatus/);
});

test("quotationItemsApi exposes line item calculation and validation helpers", () => {
  const serviceSource = read("src/services/quotationItemsApi.ts");

  assert.match(serviceSource, /calculateItemTotal/);
  assert.match(serviceSource, /calculateQuotationGrandTotal/);
  assert.match(serviceSource, /validateLineItems/);
  assert.match(serviceSource, /normalizeLineItems/);
});

test("LeadSelectDropdown fetches leads with fallback and search capability", () => {
  const dropdownSource = read(
    "src/components/dashboard/quotations/LeadSelectDropdown.tsx",
  );

  assert.match(dropdownSource, /apiClient\.get<[^>]+>\("\/leads"\)/);
  assert.match(dropdownSource, /fallbackLeads/);
  assert.match(dropdownSource, /Select Qualified Lead/);
  assert.match(dropdownSource, /Search leads/);
});

test("quotations dashboard client integrates service layer, lead selector, and status tabs", () => {
  const clientSource = read(
    "src/components/dashboard/quotations/QuotationsDashboardClient.tsx",
  );

  assert.match(clientSource, /listQuotations\(\{\s*status:\s*(?:activeTab|tab)\s*\}\)/);
  assert.match(clientSource, /LeadSelectDropdown/);
  assert.match(clientSource, /loadQuotations/);
  assert.match(clientSource, /onRetry=\{loadQuotations\}/);
});

test("quotations dashboard client wires edit, reject, revise, direct approve, PDF, and convert actions", () => {
  const clientSource = read(
    "src/components/dashboard/quotations/QuotationsDashboardClient.tsx",
  );

  // PDF generation/download via service
  assert.match(clientSource, /getQuotationPdf\(quotation\.id\)/);
  assert.match(clientSource, /window\.open\(quotation\.pdfUrl/);

  // Revise action via service
  assert.match(clientSource, /reviseQuotation\(quotation\.id\)/);

  // Direct approve action via service
  assert.match(clientSource, /approveQuotation\(quotation\.id\)/);

  // Modals integration
  assert.match(clientSource, /<EditQuotationModal/);
  assert.match(clientSource, /<RejectQuotationModal/);
  assert.match(clientSource, /<ConvertToProjectModal/);

  // Converted link button
  assert.match(
    clientSource,
    /\/dashboard\/projects\/\$\{quotation\.projectId\}/,
  );
});

test("EditQuotationModal submits updateQuotation and enforces lock rules", () => {
  const modalSource = read(
    "src/components/dashboard/quotations/modals/EditQuotationModal.tsx",
  );

  assert.match(
    modalSource,
    /quotation\.status === "APPROVED" \|\| quotation\.status === "CONVERTED"/,
  );
  assert.match(
    modalSource,
    /updateQuotation\(quotation\.id,\s*payload\)/,
  );
  assert.match(modalSource, /calculateLineItemAmount/);
  assert.match(modalSource, /calculateTotalAmount/);
});

test("RejectQuotationModal submits rejectQuotation with min 5 chars validation", () => {
  const modalSource = read(
    "src/components/dashboard/quotations/modals/RejectQuotationModal.tsx",
  );

  assert.match(modalSource, /trimmedReason\.length < 5/);
  assert.match(
    modalSource,
    /Rejection reason must be at least 5 characters long/,
  );
  assert.match(
    modalSource,
    /rejectQuotation\(quotation\.id,\s*\{\s*reason:\s*trimmedReason,?\s*\}\)/,
  );
});

test("ConvertToProjectModal submits convertQuotationToProject and handles 409 conflict", () => {
  const modalSource = read(
    "src/components/dashboard/quotations/modals/ConvertToProjectModal.tsx",
  );

  assert.match(
    modalSource,
    /convertQuotationToProject\(quotation\.id,\s*payload\)/,
  );
  assert.match(modalSource, /isAlreadyConvertedError/);
  assert.match(modalSource, /onAlreadyConverted/);
});
