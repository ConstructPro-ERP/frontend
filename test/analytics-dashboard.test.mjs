import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("analytics page renders the dedicated analytics dashboard client", () => {
  const pageSource = read("src/app/dashboard/analytics/page.tsx");

  assert.match(pageSource, /AnalyticsDashboardClient/);
  assert.doesNotMatch(pageSource, /DashboardPlaceholderPage/);
});

test("analytics dashboard client uses shared API client and analytics endpoints", () => {
  const clientSource = read(
    "src/components/dashboard/analytics/AnalyticsDashboardClient.tsx",
  );

  assert.match(clientSource, /apiClient\.get<unknown>\("\/analytics\/dashboard"\)/);
  assert.match(clientSource, /apiClient\.get<unknown>\("\/analytics\/export"\)/);
});

test("analytics dashboard includes required KPI and summary section copy", () => {
  const utilsSource = read(
    "src/components/dashboard/analytics/analyticsUtils.ts",
  );

  assert.match(utilsSource, /Active Projects/);
  assert.match(utilsSource, /Delayed Projects/);
  assert.match(utilsSource, /Revenue This Period/);
  assert.match(utilsSource, /Outstanding Payments/);
  assert.match(utilsSource, /High-Risk Projects/);
  assert.match(utilsSource, /Revenue Summary/);
  assert.match(utilsSource, /Payment Trend Summary/);
  assert.match(utilsSource, /Project Status Summary/);
  assert.match(utilsSource, /Risk Summary/);
});

test("analytics dashboard client includes loading, empty, unavailable, and error states", () => {
  const clientSource = read(
    "src/components/dashboard/analytics/AnalyticsDashboardClient.tsx",
  );

  assert.match(clientSource, /Analytics dashboard unavailable/);
  assert.match(clientSource, /No analytics data available/);
  assert.match(clientSource, /Analytics APIs are not available yet/);
  assert.match(clientSource, /Export Analytics/);
  assert.match(clientSource, /Run Analysis Placeholder/);
});

test("analytics utilities keep preview data and normalization helpers", () => {
  const utilsSource = read(
    "src/components/dashboard/analytics/analyticsUtils.ts",
  );

  assert.match(utilsSource, /analyticsPreviewData/);
  assert.match(utilsSource, /normalizeAnalyticsDashboardData/);
  assert.match(utilsSource, /normalizeKpis/);
  assert.match(utilsSource, /normalizeRevenuePoints/);
  assert.match(utilsSource, /normalizeSummaryMetrics/);
  assert.match(utilsSource, /normalizeRiskItems/);
  assert.match(utilsSource, /isAnalyticsUnavailableError/);
});
