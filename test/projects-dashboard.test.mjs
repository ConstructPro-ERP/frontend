import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function read(path) {
  return readFileSync(path, "utf8");
}

/**
 * Execute the TypeScript API module with a mocked
 * shared Axios client.
 */
function loadProjectsApi(get) {
  const source = read("src/services/projectsApi.ts");

  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const exports = {};

  vm.runInNewContext(compiled, {
    exports,
    require: (specifier) => {
      assert.equal(specifier, "@/lib/axios");

      return {
        __esModule: true,
        default: { get },
      };
    },
  });

  return exports;
}

test("projects page renders the real dashboard", () => {
  const source = read("src/app/dashboard/projects/page.tsx");

  assert.match(source, /ProjectsDashboardClient/);
  assert.doesNotMatch(source, /DashboardPlaceholderPage/);
});

test("project listing preserves backend pagination", async () => {
  const calls = [];

  const api = loadProjectsApi(async (url, config) => {
    calls.push({ url, params: config.params });

    return {
      data: {
        data: [],
        meta: {
          page: 2,
          limit: 10,
          total: 15,
          totalPages: 2,
        },
      },
    };
  });

  const result = await api.listProjects({
    search: "Kandy",
    status: "ACTIVE",
    page: 2,
    limit: 10,
  });

  assert.equal(calls[0].url, "/projects");
  assert.equal(calls[0].params.search, "Kandy");
  assert.equal(calls[0].params.status, "ACTIVE");
  assert.equal(calls[0].params.page, 2);

  assert.equal(result.data.length, 0);
  assert.equal(result.meta.total, 15);
  assert.equal(result.meta.totalPages, 2);
});

test("malformed project responses are rejected", async () => {
  const api = loadProjectsApi(async () => ({
    data: {
      items: [],
    },
  }));

  await assert.rejects(api.listProjects(), /Unexpected projects API response/);
});

test("dashboard supports search, filters and errors", () => {
  const source = read(
    "src/components/dashboard/projects/ProjectsDashboardClient.tsx",
  );

  assert.match(source, /listProjects/);
  assert.match(source, /PROJECT_STATUSES/);
  assert.match(source, /setDebouncedSearch/);
  assert.match(source, /Loading projects/);
  assert.match(source, /No projects found/);
  assert.match(source, /Try again/);
  assert.match(source, /pagination\.totalPages/);
});
