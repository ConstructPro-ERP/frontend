import test from "node:test";
import assert from "node:assert/strict";
import * as analyticsApi from "../.coverage-build/analyticsApi.mjs";
import * as analyticsUtils from "../.coverage-build/analyticsUtils.mjs";
import { ApiError } from "../.coverage-build/apiErrorMock.mjs";
import {
  calls,
  resetApiMock,
  setGetHandler,
} from "../.coverage-build/axiosMock.mjs";

const summary = {
  revenue: {
    totalRevenue: 1_200_000,
    paidAmount: 800_000,
    outstandingBalance: 400_000,
  },
  projects: {
    totalProjects: 3,
    activeProjectCount: 2,
    completedProjectCount: 1,
    overdueProjectCount: 1,
    completionRate: 75,
  },
  invoices: { overdueCount: 1, paidCount: 2, totalInvoices: 4 },
  sales: {
    totalLeads: 10,
    convertedLeads: 3,
    leadConversionRate: 30,
    quotationApprovalCount: 2,
    convertedQuotationCount: 1,
    totalQuotations: 5,
  },
};

test("analytics summary request uses the dashboard summary endpoint", async () => {
  resetApiMock();
  setGetHandler(async () => ({ data: summary }));
  assert.equal(await analyticsApi.getAnalyticsSummary(), summary);
  assert.equal(calls[0].url, "/analytics/dashboard/summary");
});

test("analytics fetches finance trend, project progress, and overdue invoices with bounded queries", async () => {
  resetApiMock();
  setGetHandler(async (url) => ({
    data: url.endsWith("revenue")
      ? { totalRevenue: 12, paidAmount: 9, outstandingBalance: 3 }
      : [],
  }));

  const trend = await analyticsApi.getAnalyticsFinanceTrend(2);
  const progress = await analyticsApi.getAnalyticsProjectProgress();
  const invoices = await analyticsApi.getAnalyticsOverdueInvoices();
  assert.equal(trend.length, 2);
  assert.equal(trend[0].totalRevenue, 12);
  assert.deepEqual(progress, []);
  assert.deepEqual(invoices, []);
  assert.equal(calls.length, 4);
  assert.equal(calls[0].url, "/analytics/kpis/revenue");
  assert.equal(calls[2].config.params.limit, 8);
  assert.equal(calls[3].config.params.limit, 3);
});

test("analytics builds live dashboard KPIs, trend, progress, and invoice risk", () => {
  const trend = [
    {
      label: "Jan",
      totalRevenue: 1_200_000,
      paidAmount: 800_000,
      outstandingBalance: 400_000,
    },
  ];
  const overdue = [
    {
      invoiceId: "i1",
      invoiceNumber: "INV-1",
      outstandingAmount: 1_100_000,
      customerName: "Acme",
      projectId: "p1",
      projectName: "North site",
      daysOverdue: 31,
    },
  ];
  const risks = analyticsApi.buildAnalyticsRiskItems(overdue);
  const progress = [
    {
      projectId: "p1",
      projectName: "North site",
      status: "ACTIVE",
      milestoneCount: 4,
      completedMilestoneCount: 3,
      completionPercentage: 75,
    },
  ];
  const data = analyticsApi.buildAnalyticsDashboardData(
    summary,
    trend,
    progress,
    risks,
  );

  assert.equal(data.kpis[0].value, "2");
  assert.equal(data.revenueSummary.points[0].value, 1_200_000);
  assert.equal(data.projectProgress[0].completionPercentage, 75);
  assert.equal(data.riskSummary.items[0].level, "HIGH");
  assert.match(data.riskSummary.items[0].summary, /Acme/);
  assert.equal(data.paymentTrendSummary.metrics[0].trend, "up");
});

test("analytics normalizes summary DTOs and calculates safe zero ratios", () => {
  const data = analyticsUtils.normalizeAnalyticsDashboardData({
    revenue: { totalRevenue: 0, paidAmount: 0, outstandingBalance: 0 },
    projects: {
      totalProjects: 0,
      activeProjectCount: 0,
      overdueProjectCount: 0,
      completionRate: 0,
    },
    invoices: { overdueCount: 0, paidCount: 0, totalInvoices: 0 },
    sales: {
      totalLeads: 0,
      convertedLeads: 0,
      leadConversionRate: 0,
      quotationApprovalCount: 0,
      convertedQuotationCount: 0,
      totalQuotations: 0,
    },
  });
  assert.equal(
    data.kpis
      .find((item) => item.id === "revenue-period")
      .value.replaceAll("\u00a0", " "),
    "LKR 0",
  );
  assert.equal(data.paymentTrendSummary.metrics[0].value, "0 / 0 leads");
  assert.equal(data.paymentTrendSummary.metrics[2].delta, "0 paid");
});

test("overdue invoice normalization assigns risk tiers and bounds confidence", () => {
  const risks = analyticsUtils.normalizeAnalyticsRiskItemsFromOverdueReport({
    items: [
      { invoiceId: "low", outstandingAmount: 10, daysOverdue: 1 },
      { invoiceId: "medium", outstandingAmount: 250_000, daysOverdue: 14 },
      { invoiceId: "high", outstandingAmount: 1_000_000, daysOverdue: 90 },
    ],
  });
  assert.deepEqual(
    risks.map((risk) => risk.level),
    ["LOW", "MEDIUM", "HIGH"],
  );
  assert.equal(risks[2].confidence, 98);
  assert.equal(risks[1].projectName, "Unnamed project");
});

test("AI project options accept supported backend aliases and reject malformed records", () => {
  const projects = analyticsUtils.normalizeAnalyticsAiProjectOptions({
    results: [
      { project_id: "p1", project_name: "North site", status: "ACTIVE" },
      null,
    ],
  });
  assert.deepEqual(projects, [
    { id: "p1", name: "North site", status: "ACTIVE" },
  ]);
  assert.deepEqual(
    analyticsUtils.normalizeAnalyticsAiProjectOptions({ results: "bad" }),
    [],
  );
});

test("AI prediction normalization maps snake-case fields and safely falls back", () => {
  const result = analyticsUtils.normalizeAnalyticsAiPredictionResult({
    overall_risk_level: "MEDIUM",
    milestone_delay_risk: "Moderate",
    payment_delay_risk: "Low",
    revenue_trend: "Stable",
    explanation: "Review the schedule.",
    recommended_action: "Confirm milestone owners.",
  });
  assert.equal(result.overallRiskLevel, "Medium");
  assert.equal(result.milestoneDelayRisk, "Moderate");
  assert.equal(result.recommendedAction, "Confirm milestone owners.");
  assert.equal(
    analyticsUtils.normalizeAnalyticsAiPredictionResult(null).overallRiskLevel,
    "High",
  );
});

test("analytics only treats known unavailable responses as fallback conditions", () => {
  assert.equal(
    analyticsUtils.isAnalyticsUnavailableError(
      new ApiError("down", 503, "SERVICE_UNAVAILABLE"),
    ),
    true,
  );
  assert.equal(
    analyticsUtils.isAnalyticsUnavailableError(
      new ApiError("bad", 400, "VALIDATION_ERROR"),
    ),
    false,
  );
  assert.equal(
    analyticsUtils.isAnalyticsUnavailableError(new Error("offline")),
    false,
  );
});

test("legacy analytics payloads normalize KPI, trend, metric, status, risk, and export values", () => {
  const data = analyticsUtils.normalizeAnalyticsDashboardData({
    kpis: [
      {
        id: "kpi-1",
        title: "Projects",
        displayValue: "4",
        subtitle: "Live",
        tone: "SUCCESS",
      },
      null,
    ],
    revenueSummary: {
      title: "Revenue",
      points: [{ label: "Jan", amount: "100", type: "projected" }, null],
    },
    paymentTrendSummary: {
      metrics: [
        {
          label: "Collection",
          value: "80%",
          trend: "up",
          points: [10, "bad", 5],
        },
      ],
    },
    projectStatusSummary: {
      active_projects: "5",
      delayed_projects: 1,
      completion_rate: "80%",
      notes: ["On schedule", "", 2],
    },
    riskSummary: {
      total_alerts: "1",
      items: [
        {
          id: "risk-1",
          project: "North",
          type: "Payment",
          score: "75",
          description: "Late",
          factors: ["Balance", 3],
          level: "medium",
        },
        null,
      ],
    },
    exportAvailability: "available",
  });

  assert.deepEqual(data.kpis, [
    {
      id: "kpi-1",
      label: "Projects",
      value: "4",
      note: "Live",
      tone: "success",
    },
  ]);
  assert.deepEqual(data.revenueSummary.points, [
    { month: "Jan", value: 100, kind: "PROJECTED" },
  ]);
  assert.deepEqual(data.paymentTrendSummary.metrics[0].points, [10, 5]);
  assert.equal(data.projectStatusSummary.activeProjects, 5);
  assert.deepEqual(data.projectStatusSummary.notes, ["On schedule"]);
  assert.equal(data.riskSummary.items[0].level, "MEDIUM");
  assert.equal(data.riskSummary.items[0].confidence, 75);
  assert.deepEqual(data.riskSummary.items[0].factors, ["Balance"]);
  assert.equal(data.exportAvailability, "available");
});

test("analytics malformed legacy sections safely use preview defaults", () => {
  const data = analyticsUtils.normalizeAnalyticsDashboardData({
    kpis: [null],
    revenueSummary: { points: [null] },
    paymentTrendSummary: { metrics: [null] },
    projectStatusSummary: { notes: ["", false] },
    riskSummary: { items: [null] },
    exportAvailability: "unknown",
  });
  assert.equal(
    data.kpis.length,
    analyticsUtils.analyticsPreviewData.kpis.length,
  );
  assert.equal(
    data.revenueSummary.points.length,
    analyticsUtils.analyticsPreviewData.revenueSummary.points.length,
  );
  assert.equal(
    data.paymentTrendSummary.metrics.length,
    analyticsUtils.analyticsPreviewData.paymentTrendSummary.metrics.length,
  );
  assert.equal(data.projectStatusSummary.notes.length, 0);
  assert.equal(
    data.riskSummary.items.length,
    analyticsUtils.analyticsPreviewData.riskSummary.items.length,
  );
  assert.equal(data.exportAvailability, "pending");
  assert.equal(
    analyticsUtils.normalizeAnalyticsDashboardData(undefined),
    analyticsUtils.analyticsPreviewData,
  );
});

test("analytics currency formatting handles compact millions and smaller values", () => {
  assert.equal(
    analyticsUtils.formatAnalyticsCompactCurrency(2_000_000),
    "LKR 2M",
  );
  assert.equal(
    analyticsUtils.formatAnalyticsCompactCurrency(2_500_000),
    "LKR 2.5M",
  );
  assert.match(analyticsUtils.formatAnalyticsCompactCurrency(25_000), /25,000/);
});
