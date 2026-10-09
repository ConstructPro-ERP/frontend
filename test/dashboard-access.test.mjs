import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/lib/dashboardAccess.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports },
);
const { canAccessDashboardPath: allowed } = exports;

test("dashboard access follows module read permissions", () => {
  assert.equal(allowed("ADMIN", "/dashboard/users"), true);
  assert.equal(allowed("ACCOUNTANT", "/dashboard/users"), false);
  assert.equal(allowed("ACCOUNTANT", "/dashboard/finance"), true);
  assert.equal(allowed("SALES_MANAGER", "/dashboard/leads"), true);
  assert.equal(allowed("SALES_MANAGER", "/dashboard/quotations"), true);
  assert.equal(allowed("SALES_MANAGER", "/dashboard/analytics"), false);
  assert.equal(allowed("PROJECT_MANAGER", "/dashboard/projects"), true);
  assert.equal(allowed("PROJECT_MANAGER", "/dashboard"), false);
  assert.equal(allowed("CLIENT_PORTAL_USER", "/dashboard/finance"), false);
});

test("missing roles and unknown routes fail closed, nested routes inherit permissions", () => {
  for (const role of [null, undefined, "user", "UNKNOWN"]) {
    assert.equal(allowed(role, "/dashboard"), false);
    assert.equal(allowed(role, "/dashboard/users"), false);
  }
  assert.equal(allowed("ADMIN", "/dashboard/unknown"), false);
  assert.equal(allowed("SALES_MANAGER", "/dashboard/leads/123"), true);
  assert.equal(allowed("ACCOUNTANT", "/dashboard/leads/123"), false);
  assert.equal(allowed("ADMIN", "/dashboard/users-other"), false);
});
