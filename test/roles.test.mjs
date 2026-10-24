import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(get, patch = async () => {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(
    readFileSync("src/services/roles.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  );
  vm.runInNewContext(outputText, {
    exports,
    encodeURIComponent,
    require: (name) =>
      name === "@/services/googleAuth"
        ? { normalizeAuthUser: (value) => value }
        : { default: { get, patch } },
  });
  return exports;
}

test("roles come only from the backend catalog, preserving IDs and nullable descriptions", async () => {
  const roles = [
    {
      id: "eeb66f46-c089-4977-90ad-94c6248d772b",
      roleName: "ADMIN",
      description: null,
    },
    {
      id: "769b7366-f6e1-48f1-8779-0bbd2e9a9883",
      roleName: "SALES_MANAGER",
      description: null,
    },
    {
      id: "43942fad-a1e8-4c75-a28c-c3cf4506b6c3",
      roleName: "PROJECT_MANAGER",
      description: null,
    },
    {
      id: "64e96d08-20dc-494f-af44-af32afda4fb9",
      roleName: "ACCOUNTANT",
      description: null,
    },
    {
      id: "5a5f374c-d380-40f5-b4b1-ae93f974e88b",
      roleName: "CLIENT_PORTAL_USER",
      description: null,
    },
  ];
  const calls = [];
  const result = await load(async (url) => {
    calls.push(url);
    return { success: true, statusCode: 200, data: roles };
  }).getRoles();
  assert.deepEqual(calls, ["/auth/roles"]);
  assert.deepEqual(result, roles);
});

test("role catalog failures are surfaced", async () => {
  await assert.rejects(
    load(async () => {
      throw new Error("unavailable");
    }).getRoles(),
    /unavailable/,
  );
});
