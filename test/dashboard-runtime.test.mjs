import test from "node:test";
import assert from "node:assert/strict";
import * as dashboardApi from "../.coverage-build/dashboardApi.mjs";
import {
  calls,
  resetApiMock,
  setGetHandler,
} from "../.coverage-build/axiosMock.mjs";

const emptySummary = () => ({
  revenue: { totalRevenue: 0, paidAmount: 0, outstandingBalance: 0 },
  projects: { totalProjects: 0 },
  invoices: { totalInvoices: 0 },
  sales: { totalLeads: 0, totalQuotations: 0 },
});

test("home dashboard loads summary from the dashboard analytics endpoint", async () => {
  resetApiMock();
  const summary = emptySummary();
  setGetHandler(async () => ({ data: summary }));

  assert.equal(await dashboardApi.getDashboardSummary(), summary);
  assert.deepEqual(calls, [
    { url: "/analytics/dashboard/summary", config: undefined },
  ]);
});

test("home dashboard distinguishes a zero summary from one with business data", () => {
  assert.equal(dashboardApi.isDashboardSummaryEmpty(emptySummary()), true);
  assert.equal(
    dashboardApi.isDashboardSummaryEmpty({
      ...emptySummary(),
      projects: { totalProjects: 1 },
    }),
    false,
  );
  assert.equal(
    dashboardApi.isDashboardSummaryEmpty({
      ...emptySummary(),
      revenue: { totalRevenue: 0, paidAmount: 0, outstandingBalance: 20 },
    }),
    false,
  );
});

test("home dashboard requests active projects with the expected table limits", async () => {
  resetApiMock();
  const projects = [{ projectId: "p1", projectName: "North site" }];
  setGetHandler(async () => ({ data: projects }));

  assert.equal(await dashboardApi.getDashboardProjects(), projects);
  assert.deepEqual(calls[0], {
    url: "/analytics/reports/project-completion",
    config: {
      params: {
        status: "ACTIVE",
        page: 1,
        limit: 5,
        sortBy: "endDate",
        sortOrder: "asc",
      },
    },
  });
});

test("home dashboard loads every project status count from pagination metadata", async () => {
  resetApiMock();
  setGetHandler(async (_url, config) => ({
    data: [],
    meta: { total: config.params.status === "ACTIVE" ? 3 : 0 },
  }));

  const counts = await dashboardApi.getDashboardStatusCounts();
  assert.equal(calls.length, 5);
  assert.equal(counts.find((item) => item.status === "ACTIVE").count, 3);
  assert.equal(counts.find((item) => item.status === "CANCELLED").count, 0);
  assert.ok(calls.every((call) => call.config.params.limit === 1));
});

test("home dashboard rejects project counts when the backend omits totals", async () => {
  resetApiMock();
  setGetHandler(async () => ({ data: [] }));
  await assert.rejects(
    dashboardApi.getDashboardStatusCounts(),
    /Project totals are unavailable/,
  );
});

test("home dashboard activity defaults missing pagination metadata", async () => {
  resetApiMock();
  setGetHandler(async () => ({ data: [{ title: "Invoice issued" }] }));
  const page = await dashboardApi.getDashboardActivity(3);
  assert.equal(page.items.length, 1);
  assert.equal(page.page, 3);
  assert.equal(page.totalPages, 3);
  assert.deepEqual(calls[0].config.params, { page: 3, limit: 5 });
});

test("home dashboard revenue requests six months and returns backend totals", async () => {
  resetApiMock();
  setGetHandler(async (_url, config) => ({
    data: {
      totalRevenue: 100,
      paidAmount: 60,
      outstandingBalance: 40,
      fromDate: config.params.fromDate,
      toDate: config.params.toDate,
    },
  }));
  const months = await dashboardApi.getDashboardRevenue();
  assert.equal(months.length, 6);
  assert.equal(months[5].revenue, 100);
  assert.equal(months[5].paid, 60);
  assert.equal(months[5].outstanding, 40);
  assert.equal(calls.length, 6);
  assert.equal(calls[5].url, "/analytics/kpis/revenue");
});
