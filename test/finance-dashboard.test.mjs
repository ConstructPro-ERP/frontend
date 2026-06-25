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
  assert.match(clientSource, /Finance APIs are not available yet/);
});

test("finance dashboard uses the shared API client and finance endpoints", () => {
  const clientSource = read(
    "src/components/dashboard/finance/FinanceDashboardClient.tsx",
  );

  assert.match(
    clientSource,
    /apiClient\.get<unknown>\("\/finance\/invoices"\)/,
  );
  assert.match(clientSource, /apiClient\.get<unknown>\("\/finance\/summary"\)/);
  assert.match(clientSource, /apiClient\.post\("\/finance\/payments"/);
});

test("finance utilities keep preview data, filter helpers, and summary helpers", () => {
  const utilsSource = read("src/components/dashboard/finance/financeUtils.ts");

  assert.match(utilsSource, /financePreviewInvoices/);
  assert.match(utilsSource, /filterInvoices/);
  assert.match(utilsSource, /calculateFinanceSummary/);
  assert.match(utilsSource, /normalizeFinanceStatus/);
  assert.match(utilsSource, /buildOutstandingBalances/);
  assert.match(utilsSource, /validateFinancePaymentForm/);
  assert.match(utilsSource, /applyFinancePaymentToInvoice/);
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
