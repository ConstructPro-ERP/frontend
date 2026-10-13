import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const nativeRequire = createRequire(import.meta.url);
const managerId = "b390c2c8-86f5-484f-ad9f-170bca22703d";
const milestoneId = "0bf3b9dd-ce36-480a-8bc8-a5a28dde483c";

function loader(api = {}, states) {
  const cache = new Map();
  let stateIndex = 0;
  function load(path) {
    let filename = resolve(path);
    if (!existsSync(filename))
      filename += existsSync(filename + ".ts") ? ".ts" : ".tsx";
    if (states && filename.endsWith("useProjectData.ts")) {
      return {
        useProjectData: () => {
          const state = states[stateIndex++];
          assert.ok(state, "Provide a response for each data hook");
          return { data: state, loading: false, error: "" };
        },
      };
    }
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInNewContext(
      code,
      {
        exports,
        Error,
        URL,
        FormData,
        File,
        crypto,
        console,
        Intl,
        setTimeout,
        clearTimeout,
        require: (specifier) => {
          if (specifier === "@/lib/axios")
            return { __esModule: true, default: api };
          if (specifier.startsWith("@/"))
            return load(resolve("src", specifier.slice(2)));
          if (specifier.startsWith("."))
            return load(resolve(dirname(filename), specifier));
          return nativeRequire(specifier);
        },
      },
      { filename },
    );
    return exports;
  }
  return load;
}

const rules = loader()("src/lib/projectResourceRules.ts");
const documentRules = loader()("src/lib/projectDocumentRules.ts");

test("calendar validation rejects impossible dates and accepts leap days", () => {
  assert.equal(rules.isCalendarDate("2028-02-29"), true);
  for (const value of [
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "12/01/2026",
    "",
  ]) {
    assert.equal(rules.isCalendarDate(value), false, value);
  }
});

test("milestones require valid weight, status and date", () => {
  const valid = {
    milestoneName: "Foundation",
    weight: "3",
    status: "PENDING",
    dueDate: "",
  };
  assert.equal(rules.validateMilestone(valid), null);
  for (const invalid of [
    { milestoneName: " " },
    { weight: "" },
    { weight: "1.5" },
    { weight: "0" },
    { weight: "11" },
    { weight: "NaN" },
    { status: "TODO" },
    { dueDate: "2026-02-30" },
    { description: "x".repeat(2001) },
  ])
    assert.ok(rules.validateMilestone({ ...valid, ...invalid }));
});

test("milestone progress accepts whole-number boundaries and rejects empty or fractional input", () => {
  for (const progress of ["0", "50", "100"])
    assert.equal(rules.validateMilestoneProgress({ progress }), null);
  for (const progress of ["", " ", "-1", "101", "1.5", "Infinity"])
    assert.ok(rules.validateMilestoneProgress({ progress }));
});

test("task form validates UUID selections, name, calendar date and status", () => {
  assert.equal(
    rules.validateTask({
      taskName: "Pour concrete",
      milestoneId,
      dueDate: "2026-10-20",
    }),
    null,
  );
  assert.equal(
    rules.validateTask({ taskName: "Project task", milestoneId: "" }),
    null,
  );
  assert.ok(rules.validateTask({ taskName: " ", milestoneId }));
  assert.ok(
    rules.validateTask({ taskName: "Task", milestoneId: "Foundation" }),
  );
  assert.ok(rules.validateTask({ taskName: "Task", dueDate: "2026-02-30" }));
  for (const status of ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"])
    assert.equal(rules.validateTaskStatus({ status }), null);
  assert.ok(rules.validateTaskStatus({ status: "ACTIVE" }));
});

test("expenses preserve decimal input and validate dates and category", () => {
  const valid = { amount: "100.25", category: "Materials", date: "2026-10-13" };
  assert.equal(rules.validateExpense(valid), null);
  for (const amount of ["0", "-1", "1e3", "1.001", "Infinity", ""])
    assert.ok(rules.validateExpense({ ...valid, amount }));
  assert.ok(rules.validateExpense({ ...valid, category: " " }));
  assert.ok(rules.validateExpense({ ...valid, date: "2026-02-29" }));
  assert.equal(
    rules.validateDateFilters({
      startDate: "2026-10-13",
      endDate: "2026-10-13",
    }),
    null,
  );
  assert.ok(
    rules.validateDateFilters({
      startDate: "2026-10-14",
      endDate: "2026-10-13",
    }),
  );
});

test("selector pagination includes later pages and rejects a server repeating page one", async () => {
  const { listAllResources } = loader()("src/services/projectResources.ts");
  const calls = [];
  const result = await listAllResources(async ({ page, limit }) => {
    calls.push({ page, limit });
    return {
      data: [{ id: String(page) }],
      meta: { page, limit, total: 2, totalPages: 2 },
    };
  });
  assert.deepEqual(
    Array.from(result, (item) => item.id),
    ["1", "2"],
  );
  assert.deepEqual(calls, [
    { page: 1, limit: 100 },
    { page: 2, limit: 100 },
  ]);
  await assert.rejects(
    listAllResources(async () => ({
      data: [],
      meta: { page: 1, limit: 100, total: 101, totalPages: 2 },
    })),
    /complete selection list/,
  );
});

test("invalid resource pagination is rejected instead of showing a broken pager", async () => {
  for (const meta of [
    { page: 0, limit: 10, total: 1, totalPages: 1 },
    { page: 1, limit: 10, total: -1, totalPages: 1 },
    { page: 1, limit: 10, total: 1, totalPages: NaN },
    { total: 1 },
  ]) {
    const api = loader({ get: async () => ({ data: { data: [], meta } }) })(
      "src/services/projectResources.ts",
    );
    await assert.rejects(api.listResource("/tasks"), /Unexpected/);
  }
});

test("assignee directory is project-scoped and retrieves all names", async () => {
  const calls = [];
  const api = loader({
    get: async (url, { params }) => {
      calls.push(url);
      return {
        data: [
          {
            id: params.page === 1 ? managerId : milestoneId,
            fullName: params.page === 1 ? "Asha" : "Nimal",
          },
        ],
        meta: { page: params.page, limit: 100, total: 2, totalPages: 2 },
      };
    },
  })("src/services/tasksApi.ts");
  const users = await api.listTaskAssignees("project/one");
  assert.deepEqual(calls, [
    "/projects/project%2Fone/task-assignees",
    "/projects/project%2Fone/task-assignees",
  ]);
  assert.deepEqual(
    Array.from(users, (user) => user.fullName),
    ["Asha", "Nimal"],
  );
});

test("document file validation rejects empty, oversized and unsupported files", () => {
  assert.equal(
    documentRules.validateDocumentFile({ name: "PLAN.PDF", size: 1024 }),
    null,
  );
  assert.equal(
    documentRules.validateDocumentFile({
      name: "plan.pdf",
      size: documentRules.MAX_DOCUMENT_BYTES,
    }),
    null,
  );
  for (const file of [
    null,
    { name: "plan.pdf", size: 0 },
    { name: "plan.pdf", size: documentRules.MAX_DOCUMENT_BYTES + 1 },
    { name: "plan.exe", size: 50 },
    { name: "plan.svg", size: 50 },
  ])
    assert.ok(documentRules.validateDocumentFile(file));
  assert.ok(
    documentRules.validateDocumentMetadata({
      fileName: "../plan.pdf",
      categoryId: milestoneId,
    }),
  );
  assert.ok(
    documentRules.validateDocumentMetadata({
      fileName: "plan.pdf",
      categoryId: "Drawings",
    }),
  );
});

test("document uploads send multipart content, category UUID, progress and an idempotency key", async () => {
  const progress = [];
  const file = new File(["plan"], "plan.pdf", { type: "application/pdf" });
  const api = loader({
    post: async (url, body, config) => {
      assert.equal(url, "/projects/project%2Fone/documents");
      assert.equal(body.get("file").name, "plan.pdf");
      assert.equal(body.get("categoryId"), milestoneId);
      assert.equal(body.has("uploadedById"), false);
      assert.equal(config.headers["Content-Type"], "multipart/form-data");
      assert.match(config.headers["Idempotency-Key"], /^[\da-f-]{36}$/i);
      config.onUploadProgress({ loaded: 2, total: 4 });
      return { data: { id: "document-1" } };
    },
  })("src/services/documentsApi.ts");
  assert.equal(
    (
      await api.uploadDocument("project/one", file, milestoneId, (value) =>
        progress.push(value),
      )
    ).id,
    "document-1",
  );
  assert.deepEqual(progress, [50]);
});

test("invalid uploads never call the server", async () => {
  let calls = 0;
  const api = loader({
    post: async () => {
      calls += 1;
    },
  })("src/services/documentsApi.ts");
  await assert.rejects(
    api.uploadDocument("project", new File(["exe"], "bad.exe"), milestoneId),
    /Choose/,
  );
  assert.equal(calls, 0);
});

test("document requests preserve filters, metadata, delete path and download URL", async () => {
  const calls = [];
  const api = loader({
    get: async (url, config) => {
      calls.push({ url, params: config?.params });
      return url.endsWith("/download")
        ? { data: { url: "https://storage.example/plan.pdf?token=signed" } }
        : { data: [] };
    },
    patch: async (url, body) => {
      calls.push({ url, body });
      return { data: { id: "doc" } };
    },
    del: async (url) => {
      calls.push({ url });
    },
  })("src/services/documentsApi.ts");
  await api.listDocuments("project", {
    search: "plan",
    categoryId: milestoneId,
    page: 2,
    limit: 10,
  });
  assert.equal(calls[0].params.categoryId, milestoneId);
  assert.equal(calls[0].params.search, "plan");
  assert.equal(calls[0].params.page, 2);
  await api.updateDocument("doc/1", {
    fileName: "renamed.pdf",
    categoryId: milestoneId,
  });
  assert.equal(calls[1].url, "/documents/doc%2F1");
  assert.equal(calls[1].body.categoryId, milestoneId);
  assert.equal(
    await api.getDocumentDownloadUrl("doc"),
    "https://storage.example/plan.pdf?token=signed",
  );
  await api.deleteDocument("doc/1");
  assert.equal(calls.at(-1).url, "/documents/doc%2F1");
});

test("download URL validation rejects executable schemes, relative links and credentials", async () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "/private/file",
    "https://user:pass@example.com/file",
    undefined,
  ]) {
    const api = loader({ get: async () => ({ data: { url } }) })(
      "src/services/documentsApi.ts",
    );
    await assert.rejects(api.getDocumentDownloadUrl("document"));
  }
});

test("task tables and filters display names while select values remain UUIDs", () => {
  const load = loader({}, [
    [{ id: milestoneId, milestoneName: "Foundation" }],
    [{ id: managerId, fullName: "Asha Perera" }],
    {
      data: [
        {
          id: "task",
          taskName: "Inspect concrete",
          assignedToId: managerId,
          milestoneId,
          status: "TODO",
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
  ]);
  const Tasks = load(
    "src/components/dashboard/projects/TasksSection.tsx",
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(Tasks, { projectId: "project", canManage: false }),
  );
  assert.ok(html.includes('value="' + milestoneId + '">Foundation</option>'));
  assert.ok(html.includes('value="' + managerId + '">Asha Perera</option>'));
  assert.match(html, /Inspect concrete/);
  assert.doesNotMatch(html, /UUID|Add task|>Edit<|>Delete</);
});

test("documents expose download but hide mutations for read-only project readers", () => {
  const load = loader({}, [
    {
      data: [
        {
          id: "doc",
          fileName: "Plan.pdf",
          categoryId: milestoneId,
          category: { id: milestoneId, categoryName: "Drawings" },
          sizeBytes: 1024,
          createdAt: "2026-10-13",
          uploadedBy: { fullName: "Asha Perera" },
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
    [{ id: milestoneId, categoryName: "Drawings" }],
  ]);
  const Documents = load(
    "src/components/dashboard/projects/DocumentsSection.tsx",
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(Documents, { projectId: "project", canManage: false }),
  );
  assert.match(html, /Plan.pdf|Drawings/);
  assert.match(html, /Download Plan.pdf/);
  assert.doesNotMatch(html, /Upload document|>Edit<|>Delete<|Coming soon/);
});

test("document upload has required file and category inputs and described restrictions", () => {
  const Upload = loader()(
    "src/components/dashboard/projects/DocumentUploadModal.tsx",
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(Upload, {
      projectId: "project",
      categories: [{ id: milestoneId, categoryName: "Drawings" }],
      onSaved() {},
      onClose() {},
    }),
  );
  assert.match(html, /type="file"[^>]*required/);
  assert.match(html, /aria-describedby="document-file-help"/);
  assert.match(html, /<select required/);
  assert.match(html, /Maximum 20 MB/);
});
