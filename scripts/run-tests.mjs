import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const root = process.cwd();
const buildDirectory = path.join(root, ".coverage-build");
const targets = [
  ["src/services/dashboardApi.ts", "dashboardApi.mjs"],
  [
    "src/components/dashboard/analytics/analyticsUtils.ts",
    "analyticsUtils.mjs",
  ],
  ["src/services/analyticsApi.ts", "analyticsApi.mjs"],
  ["src/services/aiForecastingApi.ts", "aiForecastingApi.mjs"],
];

async function buildModules() {
  await rm(buildDirectory, { recursive: true, force: true });
  await mkdir(buildDirectory, { recursive: true });
  for (const [sourcePath, outputName] of targets) {
    const source = await readFile(path.join(root, sourcePath), "utf8");
    const { outputText, diagnostics } = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: sourcePath,
      reportDiagnostics: true,
    });
    const errors = diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    if (errors?.length) {
      throw new Error(
        errors
          .map((diagnostic) =>
            ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
          )
          .join("\n"),
      );
    }
    const rewritten = outputText
      .replaceAll('"@/lib/axios"', '"./axiosMock.mjs"')
      .replaceAll('"@/lib/ApiError"', '"./apiErrorMock.mjs"')
      .replaceAll(
        '"@/components/dashboard/analytics/analyticsUtils"',
        '"./analyticsUtils.mjs"',
      );
    await writeFile(path.join(buildDirectory, outputName), rewritten);
  }
  await writeFile(
    path.join(buildDirectory, "axiosMock.mjs"),
    `let getHandler = async () => ({ data: undefined });
export const calls = [];
export function setGetHandler(handler) { getHandler = handler; }
export function resetApiMock() { calls.length = 0; getHandler = async () => ({ data: undefined }); }
const apiClient = { get(url, config) { calls.push({ url, config }); return getHandler(url, config); } };
export default apiClient;
`,
  );
  await writeFile(
    path.join(buildDirectory, "apiErrorMock.mjs"),
    `export class ApiError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
`,
  );
}

try {
  await buildModules();

  const tests = (await readdir(path.join(root, "test")))
    .filter((file) => file.endsWith(".test.mjs"))
    .map((file) => path.join("test", file));

  // Enable coverage only when explicitly requested.
  const withCoverage = process.argv.includes("--coverage");

  const testArgs = ["--test"];

  if (withCoverage) {
    testArgs.push(
      "--experimental-test-coverage",
      "--test-coverage-include=.coverage-build/**/*.mjs",
      "--test-coverage-exclude=.coverage-build/axiosMock.mjs",
      "--test-coverage-exclude=.coverage-build/apiErrorMock.mjs",
      "--test-coverage-lines=90",
      "--test-coverage-branches=60",
      "--test-coverage-functions=95",
    );
  }

  const result = spawnSync(process.execPath, [...testArgs, ...tests], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  process.exitCode = result.status ?? 1;
} finally {
  // Clean up temporary modules generated for test execution.
  await rm(buildDirectory, { recursive: true, force: true });
}
