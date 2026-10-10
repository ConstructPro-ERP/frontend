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

test("quotation permission helpers accept nullable authentication roles", () => {
  const utilsSource = read(
    "src/components/dashboard/quotations/quotationUtils.ts",
  );

  const permissionHelpers = [
    "canCreateQuotation",
    "canApproveQuotation",
    "canRejectQuotation",
  ];

  // Ensure future changes preserve compatibility with nullable user roles.
  for (const helper of permissionHelpers) {
    const signature = new RegExp(
      `export function ${helper}\\(\\s*role:\\s*string\\s*\\|\\s*null\\s*\\|\\s*undefined,?\\s*\\): boolean`,
    );

    assert.match(utilsSource, signature);
  }
});


test("quotations dashboard client calls GET /quotations on mount and on filter change", () => {
  const clientSource = read(
    "src/components/dashboard/quotations/QuotationsDashboardClient.tsx",
  );

  assert.match(clientSource, /apiClient\s*\.\s*get/);
  assert.match(clientSource, /`\/quotations\$\{query\}`/);
  assert.match(clientSource, /useEffect\(\(\) => \{/);
  assert.match(clientSource, /\[activeTab\]/);
});

test("quotations dashboard client wires edit, reject, revise, PDF, and convert actions", () => {
  const clientSource = read(
    "src/components/dashboard/quotations/QuotationsDashboardClient.tsx",
  );

  // PDF generation/download
  assert.match(
    clientSource,
    /apiClient\.get<\{ pdfUrl: string \}>\(\s*`\/quotations\/\$\{quotation\.id\}\/pdf`/,
  );
  assert.match(clientSource, /window\.open\(quotation\.pdfUrl/);

  // Revise action (PATCH /quotations/:id/revise)
  assert.match(
    clientSource,
    /apiClient\.patch<Quotation>\(\s*`\/quotations\/\$\{quotation\.id\}\/revise`,\s*\{\}/,
  );

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

test("EditQuotationModal submits PUT /quotations/:id and enforces lock rules", () => {
  const modalSource = read(
    "src/components/dashboard/quotations/modals/EditQuotationModal.tsx",
  );

  assert.match(
    modalSource,
    /quotation\.status === "APPROVED" \|\| quotation\.status === "CONVERTED"/,
  );
  assert.match(
    modalSource,
    /apiClient\.put<Quotation>\(\s*`\/quotations\/\$\{quotation\.id\}`,\s*payload/,
  );
  assert.match(modalSource, /calculateLineItemAmount/);
  assert.match(modalSource, /calculateTotalAmount/);
});

test("RejectQuotationModal submits PATCH /quotations/:id/reject with min 5 chars validation", () => {
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
    /apiClient\.patch<Quotation>\(\s*`\/quotations\/\$\{quotation\.id\}\/reject`,\s*\{\s*reason:\s*trimmedReason\s*\}/,
  );
});

test("ConvertToProjectModal submits PATCH /quotations/:id/approve and handles 409 conflict", () => {
  const modalSource = read(
    "src/components/dashboard/quotations/modals/ConvertToProjectModal.tsx",
  );

  assert.match(
    modalSource,
    /apiClient\.patch<ConvertToProjectResponse \| Quotation>\(\s*`\/quotations\/\$\{quotation\.id\}\/approve`,\s*payload/,
  );
  assert.match(modalSource, /isAlreadyConvertedError/);
  assert.match(modalSource, /onAlreadyConverted/);
});
