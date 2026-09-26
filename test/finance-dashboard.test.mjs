import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("finance page renders the dedicated finance dashboard client", () => {
  const pageSource = read("src/app/dashboard/finance/page.tsx");

  assert.match(pageSource, /FinanceDashboardClient/);
  assert.doesNotMatch(pageSource, /DashboardPlaceholderPage/);
});

test("finance dashboard client includes required filter tabs and API state messages", () => {
  const clientSource = read(
    "src/components/dashboard/finance/FinanceDashboardClient.tsx",
  );
  const utilsSource = read("src/components/dashboard/finance/financeUtils.ts");

  assert.match(utilsSource, /label: "All Invoices"/);
  assert.match(utilsSource, /label: "Pending"/);
  assert.match(utilsSource, /label: "Overdue"/);
  assert.match(utilsSource, /label: "Paid"/);
  assert.match(utilsSource, /label: "Partial"/);
  assert.match(clientSource, /No invoices available/);
  assert.match(clientSource, /Finance dashboard unavailable/);
  assert.match(clientSource, /Finance dashboard unavailable/);
});

test("finance dashboard uses the shared API client and finance endpoints", () => {
  const clientSource = read(
    "src/components/dashboard/finance/FinanceDashboardClient.tsx",
  );
  const serviceSource = read("src/services/financeApi.ts");

  assert.match(clientSource, /listFinanceInvoices/);
  assert.match(
    serviceSource,
    /apiClient\.get<FinanceInvoiceDto\[]>\("\/invoices"/,
  );
  assert.match(
    clientSource,
    /apiClient\s*\.\s*get<unknown>\(\s*"\/analytics\/dashboard\/summary"/,
  );
  assert.match(clientSource, /recordFinancePayment\(paymentFormValues\)/);
  assert.match(
    serviceSource,
    /apiClient\.post<RecordFinancePaymentResponseDto>/,
  );
  assert.match(serviceSource, /`\/invoices\/\$\{invoiceId\}`/);
  assert.match(
    serviceSource,
    /apiClient\.post<FinanceInvoiceDto>\(\s*`\/invoices\/\$\{invoiceId\}\/pdf`/,
  );
});

test("finance utilities keep filter, date, validation, and summary helpers", () => {
  const utilsSource = read("src/components/dashboard/finance/financeUtils.ts");

  assert.match(utilsSource, /filterInvoices/);
  assert.match(utilsSource, /calculateFinanceSummary/);
  assert.match(utilsSource, /buildOutstandingBalances/);
  assert.match(utilsSource, /validateFinancePaymentForm/);
  assert.match(utilsSource, /formatLocalDateForApi/);
});

test("finance service aligns backend DTO fields, statuses, and errors", () => {
  const serviceSource = read("src/services/financeApi.ts");

  assert.match(serviceSource, /ISSUED: "PENDING"/);
  assert.match(serviceSource, /PARTIALLY_PAID: "PARTIAL"/);
  assert.match(
    serviceSource,
    /referenceNumber: values\.paymentReference\.trim\(\)/,
  );
  assert.match(serviceSource, /paymentDate: values\.paymentDate/);
  assert.match(serviceSource, /amount: Number\(values\.paymentAmount\)/);
  assert.match(serviceSource, /paymentMethod: paymentMethodMap/);
  assert.match(serviceSource, /PAYMENT_REFERENCE_EXISTS/);
  assert.match(serviceSource, /PAYMENT_EXCEEDS_OUTSTANDING/);
  assert.match(serviceSource, /error\.code === "VALIDATION_ERROR"/);
});

test("finance table source includes invoice actions and live payment workflow", () => {
  const clientSource = read(
    "src/components/dashboard/finance/FinanceDashboardClient.tsx",
  );

  assert.match(clientSource, /View/);
  assert.match(clientSource, /Record/);
  assert.match(clientSource, /PDF/);
  assert.match(clientSource, /Export/);
  assert.match(clientSource, /Record Payment/);
  assert.match(clientSource, /Payment Reference/);
  assert.match(clientSource, /Recording\.\.\./);
});

test("finance payment validation messages are present for required workflow rules", () => {
  const utilsSource = read("src/components/dashboard/finance/financeUtils.ts");

  assert.match(utilsSource, /Invoice selection is required\./);
  assert.match(utilsSource, /Payment amount is required\./);
  assert.match(utilsSource, /Payment amount must be greater than zero\./);
  assert.match(
    utilsSource,
    /Payment amount must not exceed the outstanding balance\./,
  );
  assert.match(utilsSource, /Payment date is required\./);
  assert.match(utilsSource, /Payment reference is required\./);
});
