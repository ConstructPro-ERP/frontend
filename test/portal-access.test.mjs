import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/lib/portalAccess.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports },
);
const { canAccessPortal, homePathForRole } = exports;

test("only the client portal role may open the portal", () => {
  assert.equal(canAccessPortal("CLIENT_PORTAL_USER"), true);
  for (const role of [
    "ADMIN",
    "MANAGEMENT",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
    "ACCOUNTANT",
    // The gateway only authorizes CLIENT_PORTAL_USER on /client-portal.
    "CLIENT",
    "user",
    "",
    null,
    undefined,
  ]) {
    assert.equal(canAccessPortal(role), false, String(role));
  }
});

test("clients land in the portal and staff keep the modules page", () => {
  assert.equal(homePathForRole("CLIENT_PORTAL_USER"), "/portal");
  assert.equal(homePathForRole("ADMIN"), "/modules");
  assert.equal(homePathForRole(null), "/modules");
});
