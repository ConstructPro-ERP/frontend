import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadModule(file, require = () => {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  vm.runInNewContext(outputText, { exports, require });
  return exports;
}

const messages = loadModule("src/lib/errorMessages.ts");
const { ApiError } = loadModule("src/lib/ApiError.ts", () => messages);

test("API validation errors expose every backend detail to form alerts", () => {
  const details = [
    "phone must be a valid phone number",
    "email must be an email",
  ];
  const error = new ApiError(
    "Validation failed.",
    400,
    "VALIDATION_ERROR",
    details,
    "trace-123",
  );
  assert.equal(error.message, details.join("; "));
  assert.equal(error.details, details);
  assert.equal(error.statusCode, 400);
  assert.equal(error.code, "VALIDATION_ERROR");
  assert.equal(error.traceId, "trace-123");
});

test("API errors ignore malformed details and retain existing fallbacks", () => {
  for (const details of [undefined, null, [], [null, {}, "", "  "], {}]) {
    const error = new ApiError(
      "Validation failed.",
      400,
      "VALIDATION_ERROR",
      details,
    );
    assert.equal(error.message, "Please check your input for errors.");
  }
  assert.equal(
    new ApiError("Backend message", 400, "CUSTOM_ERROR").message,
    "Backend message",
  );
  assert.equal(
    new ApiError("Validation failed.", 400, "VALIDATION_ERROR", [
      null,
      "phone must be a valid phone number",
      {},
    ]).message,
    "phone must be a valid phone number",
  );
});
