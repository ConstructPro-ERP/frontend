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

  assert.match(
    clientSource,
    /apiClient\.get<unknown>\("\/analytics\/dashboard"\)/,
  );
  assert.match(
    clientSource,
    /apiClient\.get<unknown>\("\/analytics\/export"\)/,
  );
  assert.match(
    clientSource,
    /apiClient\.post<unknown>\("\/analytics\/predictions"/,
  );
  assert.match(
    clientSource,
    /apiClient\.get<unknown>\("\/analytics\/projects"\)/,
  );
});

test("analytics dashboard keeps the prototype KPI and section wording", () => {
  const utilsSource = read(
    "src/components/dashboard/analytics/analyticsUtils.ts",
  );
  const headerSource = read("src/components/dashboard/dashboardConfig.ts");

  assert.match(utilsSource, /Active Projects/);
  assert.match(utilsSource, /Delayed Projects/);
  assert.match(utilsSource, /Revenue This Period/);
  assert.match(utilsSource, /Outstanding Payments/);
  assert.match(utilsSource, /High-Risk Projects/);
  assert.match(utilsSource, /Revenue Trend - 2026/);
  assert.match(utilsSource, /Performance Metrics/);
  assert.match(utilsSource, /AI Risk Predictions/);
  assert.match(headerSource, /Analytics & AI Risk Prediction/);
  assert.match(
    headerSource,
    /Powered by RAG · LangChain · Last analysed 2 hours ago/,
  );
  assert.match(headerSource, /Search analytics\.\.\./);
});

test("analytics dashboard client includes loading, empty, unavailable, and error states", () => {
  const clientSource = read(
    "src/components/dashboard/analytics/AnalyticsDashboardClient.tsx",
  );

  assert.match(clientSource, /Analytics dashboard unavailable/);
  assert.match(clientSource, /No analytics data available/);
  assert.match(clientSource, /Analytics APIs are not available yet/);
  assert.match(clientSource, /Export Analytics/);
  assert.match(clientSource, /AI Risk Prediction Engine/);
  assert.match(clientSource, /Running Analysis\.\.\./);
  assert.match(clientSource, /Insufficient data/);
  assert.match(clientSource, /Analysis error/);
});

test("analytics dashboard client includes role-based visibility and prediction result fields", () => {
  const clientSource = read(
    "src/components/dashboard/analytics/AnalyticsDashboardClient.tsx",
  );

  assert.match(
    clientSource,
    /userRole === "ADMIN" \|\| userRole === "MANAGER"/,
  );
  assert.match(clientSource, /Retrieval-Augmented Generation/);
  assert.match(clientSource, /LangChain RAG v2\.1/);
  assert.match(clientSource, /Overall project risk level/);
  assert.match(clientSource, /Milestone delay risk/);
  assert.match(clientSource, /Payment delay risk/);
  assert.match(clientSource, /Revenue trend/);
  assert.match(clientSource, /Plain-language explanation/);
  assert.match(clientSource, /Recommended action/);
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
  assert.match(utilsSource, /analyticsAiProjectPreviewOptions/);
  assert.match(utilsSource, /analyticsAiPredictionPreview/);
  assert.match(utilsSource, /normalizeAnalyticsAiProjectOptions/);
  assert.match(utilsSource, /normalizeAnalyticsAiPredictionResult/);
});
