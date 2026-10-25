import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadApi(get) {
  const source = readFileSync("src/services/dashboardApi.ts", "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [2026, 0, 8, 12]));
    }
  }
  vm.runInNewContext(code, {
    exports,
    Date: FixedDate,
    require: () => ({ get }),
  });
  return exports;
}

test("dashboard monthly aggregates cross years and stop at today", async () => {
  const calls = [];
  const api = loadApi(async (url, config) => {
    calls.push({ url, ...config.params });
    return { data: { totalRevenue: 0, paidAmount: 0, outstandingBalance: 0 } };
  });
  const months = await api.getDashboardRevenue();
  assert.equal(calls.length, 6);
  assert.equal(calls[0].fromDate, "2025-08-01");
  assert.equal(calls[0].toDate, "2025-08-31");
  assert.equal(calls[5].fromDate, "2026-01-01");
  assert.equal(calls[5].toDate, "2026-01-08");
  assert.ok(months.every((month) => month.revenue === 0));
});

test("project chart uses global metadata totals, not the limited row count", async () => {
  const api = loadApi(async (_url, { params }) => {
    assert.equal(params.limit, 1);
    return {
      data: [{ projectId: "one-row" }],
      meta: { total: params.status === "ACTIVE" ? 140 : 0 },
    };
  });
  const counts = await api.getDashboardStatusCounts();
  assert.equal(counts.find((item) => item.status === "ACTIVE").count, 140);
  assert.equal(
    counts
      .filter((item) => item.status !== "ACTIVE")
      .reduce((sum, item) => sum + item.count, 0),
    0,
  );
});

test("missing project totals produce an error instead of invented chart values", async () => {
  const api = loadApi(async () => ({ data: [] }));
  await assert.rejects(
    api.getDashboardStatusCounts(),
    /Project totals are unavailable/,
  );
});

test("activity pagination preserves the gateway metadata", async () => {
  const api = loadApi(async (url, { params }) => {
    assert.equal(url, "/analytics/reports/recent-activity");
    assert.equal(params.page, 2);
    return { data: [], meta: { page: 2, totalPages: 3 } };
  });
  const result = await api.getDashboardActivity(2);
  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 3);
  assert.equal(result.items.length, 0);
});
