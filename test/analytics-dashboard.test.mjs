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
  const serviceSource = read("src/services/analyticsApi.ts");
  const aiServiceSource = read("src/services/aiForecastingApi.ts");

  assert.match(
    serviceSource,
    /apiClient\.get<DashboardSummaryDto>\(\s*"\/analytics\/dashboard\/summary"/,
  );
  assert.match(serviceSource, /"\/analytics\/reports\/overdue-invoices"/);
  assert.match(serviceSource, /"\/analytics\/reports\/project-completion"/);
  assert.match(serviceSource, /"\/analytics\/kpis\/revenue"/);
  assert.match(
    aiServiceSource,
    /apiClient\.get<AnalyticsAiRiskPredictionDto>\(\s*`\/ai-forecasting\/projects\/\$\{projectId\}\/risk`/,
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

test("analytics dashboard client includes loading, empty, and error states", () => {
  const clientSource = read(
    "src/components/dashboard/analytics/AnalyticsDashboardClient.tsx",
  );

  assert.match(clientSource, /Analytics dashboard unavailable/);
  assert.match(clientSource, /No analytics data available/);
  assert.match(clientSource, /No revenue trend data is available/);
  assert.match(clientSource, /No project progress data is available/);
  assert.match(clientSource, /Export Analytics/);
  assert.match(clientSource, /AI Risk Prediction Engine/);
  assert.match(clientSource, /Running Analysis\.\.\./);
  assert.match(clientSource, /getAiPredictionErrorMessage/);
});

test("analytics dashboard client matches the live microservice-backed workflow", () => {
  const clientSource = read(
    "src/components/dashboard/analytics/AnalyticsDashboardClient.tsx",
  );
  const aiServiceSource = read("src/services/aiForecastingApi.ts");

  assert.match(clientSource, /Retrieval-Augmented Generation/);
  assert.match(clientSource, /LangChain RAG v2\.1/);
  assert.match(clientSource, /buildAnalyticsRiskItems/);
  assert.match(aiServiceSource, /AI Forecast Prediction/);
  assert.match(clientSource, /Latest live AI run for/);
  assert.match(clientSource, /Project options:/);
});

test("AI prediction UI handles exact backend results, fallback, insufficient data, and roles", () => {
  const clientSource = read(
    "src/components/dashboard/analytics/AnalyticsDashboardClient.tsx",
  );
  const serviceSource = read("src/services/aiForecastingApi.ts");
  const typesSource = read("src/types/analytics.ts");

  assert.match(typesSource, /AnalyticsAiRiskPredictionDto/);
  assert.match(typesSource, /predictionSource: AnalyticsAiPredictionSource/);
  assert.match(typesSource, /sufficientData: boolean/);
  assert.match(clientSource, /Payment-delay risk/);
  assert.match(clientSource, /Milestone-delay risk/);
  assert.match(clientSource, /Revenue trend/);
  assert.match(clientSource, /Explanation/);
  assert.match(clientSource, /Recommended action/);
  assert.match(clientSource, /Insufficient historical data/);
  assert.match(clientSource, /safe rule-based result is shown/);
  assert.match(clientSource, /canRunAiForecasting\(user\?\.role\)/);
  assert.match(serviceSource, /"ADMIN"/);
  assert.match(serviceSource, /"MANAGEMENT"/);
  assert.match(serviceSource, /"FINANCE"/);
  assert.match(serviceSource, /"ACCOUNTANT"/);
  assert.doesNotMatch(clientSource, /prediction\.context/);
  assert.doesNotMatch(clientSource, /prediction\.warnings/);
});

test("analytics utilities keep preview data and normalization helpers", () => {
  const utilsSource = read(
    "src/components/dashboard/analytics/analyticsUtils.ts",
  );

  assert.match(utilsSource, /analyticsPreviewData/);
  assert.match(utilsSource, /normalizeAnalyticsDashboardData/);
  assert.match(utilsSource, /normalizeAnalyticsRiskItemsFromOverdueReport/);
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

test("analytics charts use real monthly and project backend data", () => {
  const clientSource = read(
    "src/components/dashboard/analytics/AnalyticsDashboardClient.tsx",
  );
  const serviceSource = read("src/services/analyticsApi.ts");

  assert.match(serviceSource, /getAnalyticsFinanceTrend/);
  assert.match(serviceSource, /fromDate: range\.fromDate/);
  assert.match(serviceSource, /paidAmount: response\.data\.paidAmount/);
  assert.match(serviceSource, /buildPaymentAndSalesMetrics/);
  assert.match(clientSource, /ProjectProgressSummary/);
  assert.match(clientSource, /role="progressbar"/);
  assert.match(clientSource, /No revenue trend data is available/);
  assert.match(clientSource, /No project progress data is available/);
});
