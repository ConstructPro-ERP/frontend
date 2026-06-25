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
});

test("finance utilities keep preview data, filter helpers, and summary helpers", () => {
  const utilsSource = read("src/components/dashboard/finance/financeUtils.ts");

  assert.match(utilsSource, /financePreviewInvoices/);
  assert.match(utilsSource, /filterInvoices/);
  assert.match(utilsSource, /calculateFinanceSummary/);
  assert.match(utilsSource, /normalizeFinanceStatus/);
  assert.match(utilsSource, /buildOutstandingBalances/);
});

test("finance table source includes invoice actions and payment placeholder copy", () => {
  const clientSource = read(
    "src/components/dashboard/finance/FinanceDashboardClient.tsx",
  );

  assert.match(clientSource, /View/);
  assert.match(clientSource, /PDF/);
  assert.match(clientSource, /DDP-37 will activate this workflow/);
  assert.match(clientSource, /Record Payment/);
});
