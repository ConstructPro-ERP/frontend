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

function loader(api = {}) {
  const cache = new Map();
  function load(path) {
    let filename = resolve(path);
    if (!existsSync(filename))
      filename += existsSync(filename + ".ts") ? ".ts" : ".tsx";
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
const rules = loader()("src/lib/projectRules.ts");
const managerId = "b390c2c8-86f5-484f-ad9f-170bca22703d";
const activeProject = {
  id: "project",
  status: "ACTIVE",
  projectManagerId: managerId,
};
test("only administrators can create projects or assign managers", () => {
  for (const role of [
    "PROJECT_MANAGER",
    "ACCOUNTANT",
    "SALES_MANAGER",
    "MANAGER",
    null,
  ]) {
    assert.equal(
      rules.projectPermissions(role, managerId, activeProject).create,
      false,
    );
    assert.equal(
      rules.projectPermissions(role, managerId, activeProject).assign,
      false,
    );
  }
  assert.equal(
    rules.projectPermissions("ADMIN", "admin", activeProject).assign,
    true,
  );
});
test("project managers can only read and modify assigned projects", () => {
  const own = rules.projectPermissions(
    "PROJECT_MANAGER",
    managerId,
    activeProject,
  );
  assert.equal(own.read, true);
  assert.equal(own.manage, true);
  assert.equal(own.expenseWrite, false);
  const other = rules.projectPermissions(
    "PROJECT_MANAGER",
    "someone-else",
    activeProject,
  );
  assert.equal(other.read, false);
  assert.equal(other.manage, false);
});
test("accountants can edit expenses but cannot delete or manage projects", () => {
  const permissions = rules.projectPermissions(
    "ACCOUNTANT",
    "accountant",
    activeProject,
  );
  assert.equal(permissions.read, true);
  assert.equal(permissions.expenseWrite, true);
  assert.equal(permissions.expenseDelete, false);
  assert.equal(permissions.manage, false);
});
test("completed and cancelled projects disable all mutation actions", () => {
  for (const status of ["COMPLETED", "CANCELLED"]) {
    for (const role of ["ADMIN", "PROJECT_MANAGER", "ACCOUNTANT"]) {
      const permissions = rules.projectPermissions(role, managerId, {
        ...activeProject,
        status,
      });
      for (const key of [
        "manage",
        "assign",
        "delete",
        "expenseWrite",
        "expenseDelete",
      ])
        assert.equal(permissions[key], false);
    }
  }
});
test("only administrators can request deletion of planning projects", () => {
  assert.equal(
    rules.projectPermissions("ADMIN", "", {
      ...activeProject,
      status: "PLANNING",
    }).delete,
    true,
  );
  assert.equal(
    rules.projectPermissions("ADMIN", "", activeProject).delete,
    false,
  );
  assert.equal(
    rules.projectPermissions("PROJECT_MANAGER", managerId, {
      ...activeProject,
      status: "PLANNING",
    }).delete,
    false,
  );
});
test("lifecycle options match backend transitions without reopening terminal projects", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(rules.projectTransitions)), {
    PLANNING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
    ON_HOLD: ["ACTIVE", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  });
});
const valid = {
  projectName: "Kandy Residence",
  startDate: "2026-10-11",
  budget: 0,
  projectManagerId: managerId,
};
test("project validation accepts zero budget and optional end date", () =>
  assert.equal(rules.validateProject(valid), null));
test("project validation rejects blank names, invalid dates, budgets and managers", () => {
  for (const override of [
    { projectName: " " },
    { startDate: "" },
    { startDate: "invalid" },
    { endDate: "2026-10-10" },
    { endDate: "invalid" },
    { budget: -1 },
    { budget: NaN },
    { budget: Infinity },
    { projectManagerId: "" },
    { projectManagerId: "not-a-user" },
  ]) {
    assert.ok(rules.validateProject({ ...valid, ...override }));
  }
  assert.equal(
    rules.validateProject({ ...valid, projectManagerId: undefined }, false),
    null,
  );
});
test("expense decimal validation rejects signs, exponents, fractions over two places and zero", () => {
  for (const value of ["1", "0.01", "12500.99"])
    assert.equal(rules.isPositiveMoney(value), true);
  for (const value of [
    "0",
    "-2",
    "1e5",
    "5.001",
    "Infinity",
    "",
    "1,000",
    ".1",
  ])
    assert.equal(rules.isPositiveMoney(value), false);
});
test("project mutations use the dedicated API routes and backend payloads", async () => {
  const calls = [];
  const api = loader(
    Object.fromEntries(
      ["post", "patch", "del"].map((method) => [
        method,
        async (url, payload) => {
          calls.push([method, url, payload]);
          return { data: activeProject };
        },
      ]),
    ),
  )("src/services/projectsApi.ts");
  await api.createProject(valid);
  await api.updateProject("project", { budget: null, endDate: null });
  await api.updateProjectStatus("project", "ON_HOLD");
  await api.assignProjectManager("project", managerId);
  await api.deleteProject("project");
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["post", "/projects", valid],
    ["patch", "/projects/project", { budget: null, endDate: null }],
    ["patch", "/projects/project/status", { status: "ON_HOLD" }],
    ["patch", "/projects/project/manager", { projectManagerId: managerId }],
    ["del", "/projects/project", null],
  ]);
});
test("permission, conflict and network errors are preserved by project mutations", async () => {
  for (const message of [
    "Forbidden",
    "Project has linked records",
    "Network unavailable",
  ]) {
    const error = new Error(message);
    const api = loader({
      patch: async () => {
        throw error;
      },
    })("src/services/projectsApi.ts");
    await assert.rejects(
      api.updateProjectStatus("project", "COMPLETED"),
      (value) => value === error,
    );
  }
});
test("task listing forwards server filters, sorting and pagination", async () => {
  const query = {
    status: "BLOCKED",
    milestoneId: "milestone",
    assignedToId: managerId,
    page: 2,
    limit: 10,
    sortBy: "dueDate",
    sortOrder: "asc",
  };
  const result = {
    data: [],
    meta: { total: 12, page: 2, limit: 10, totalPages: 2 },
  };
  const tasks = loader({
    get: async (url, config) => {
      assert.equal(url, "/projects/project/tasks");
      assert.equal(config.params, query);
      return { data: result };
    },
  })("src/services/tasksApi.ts");
  assert.equal(await tasks.listTasks("project", query), result);
});
test("resource listing supports flattened envelopes and rejects malformed data", async () => {
  const load = loader({
    get: async () => ({
      data: [],
      meta: { total: 21, page: 3, limit: 10, totalPages: 3 },
    }),
  });
  const result = await load("src/services/tasksApi.ts").listTasks("project");
  assert.equal(result.meta.totalPages, 3);
  const bad = loader({ get: async () => ({ data: {} }) })(
    "src/services/tasksApi.ts",
  );
  await assert.rejects(bad.listTasks("project"), /Unexpected response/);
});
test("milestone progress and task status/assignment use separate endpoints", async () => {
  const calls = [];
  const load = loader({
    patch: async (url, input) => {
      calls.push([url, input]);
      return { data: {} };
    },
  });
  await load("src/services/milestonesApi.ts").updateMilestoneProgress(
    "milestone",
    65,
  );
  const tasks = load("src/services/tasksApi.ts");
  await tasks.assignTask("task", null);
  await tasks.updateTaskStatus("task", "BLOCKED");
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["/milestones/milestone/progress", { progress: 65 }],
    ["/tasks/task/assign", { assignedToId: null }],
    ["/tasks/task/status", { status: "BLOCKED" }],
  ]);
});
test("expense creation preserves decimal strings and leaves recorded-by to the server", async () => {
  const input = {
    amount: "123.45",
    category: "Materials",
    date: "2026-10-11",
    description: "Concrete",
  };
  const api = loader({
    post: async (url, value) => {
      assert.equal(url, "/projects/project/expenses");
      assert.equal(value, input);
      return { data: { id: "expense", ...value } };
    },
  })("src/services/expensesApi.ts");
  assert.equal((await api.createExpense("project", input)).amount, "123.45");
});
test("manager directory requests eligible managers and admins and preserves their IDs", async () => {
  const api = loader({
    get: async (url) => {
      assert.equal(url, "/users/project-managers");
      return {
        data: [
          {
            id: managerId,
            fullName: "Project Manager",
            email: "manager@example.com",
            role: { roleName: "PROJECT_MANAGER" },
          },
          {
            id: "0bf3b9dd-ce36-480a-8bc8-a5a28dde483c",
            fullName: "Administrator",
            email: "admin@example.com",
            role: { roleName: "ADMIN" },
          },
        ],
      };
    },
  })("src/services/projectManagersApi.ts");
  assert.deepEqual(
    Array.from(await api.listProjectManagers(), (user) => user.id),
    [managerId, "0bf3b9dd-ce36-480a-8bc8-a5a28dde483c"],
  );
});
test("conversion links use the actual returned project ID and preserve quotation status", async () => {
  for (const data of [
    {
      quotation: { id: "quotation", status: "APPROVED" },
      projectId: managerId,
      projectStatus: "PLANNING",
    },
    { id: "quotation", status: "CONVERTED", projectId: managerId },
  ]) {
    const api = loader({ patch: async () => ({ data }) })(
      "src/services/projectConversionApi.ts",
    );
    const result = await api.convertQuotationToProject("quotation", {
      targetProjectId: managerId,
    });
    assert.equal(result.projectId, managerId);
    assert.equal(result.quotation.projectId, managerId);
    assert.equal(
      result.quotation.status,
      data.quotation?.status ?? data.status,
    );
  }
});
test("conversion never invents a missing project ID", async () => {
  for (const data of [
    { id: "quotation" },
    { projectId: "" },
    { projectId: " " },
    null,
  ]) {
    const api = loader({ patch: async () => ({ data }) })(
      "src/services/projectConversionApi.ts",
    );
    await assert.rejects(
      api.convertQuotationToProject("quotation", {}),
      /did not return a project ID/,
    );
  }
});
test("approval permissions and already-converted detection match the backend", () => {
  const load = loader();
  const utils = load("src/components/dashboard/quotations/quotationUtils.ts");
  assert.equal(utils.canApproveQuotation("ADMIN"), true);
  for (const role of [
    "MANAGER",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
    "ACCOUNTANT",
    null,
  ])
    assert.equal(utils.canApproveQuotation(role), false);
  const { ApiError } = load("src/lib/ApiError.ts");
  assert.equal(
    utils.isAlreadyConvertedError(
      new ApiError("Conflict", 409, "OTHER_CONFLICT"),
    ),
    false,
  );
  assert.equal(
    utils.isAlreadyConvertedError(
      new ApiError("Already converted", 409, "ALREADY_CONVERTED"),
    ),
    true,
  );
});
test("progress displays unavailable for absent data and clamps displayed percentages", () => {
  const { Progress } = loader()(
    "src/components/dashboard/projects/ProjectUI.tsx",
  );
  for (const value of [undefined, null, NaN]) {
    const html = renderToStaticMarkup(React.createElement(Progress, { value }));
    assert.match(html, /Not available/);
    assert.doesNotMatch(html, /NaN|<progress/);
  }
  const html = renderToStaticMarkup(
    React.createElement(Progress, { value: 120 }),
  );
  assert.match(html, /value="100"/);
  assert.match(html, /100.0%/);
});
test("shared editor renders accessible required fields and named dialog", () => {
  const { Editor } = loader()(
    "src/components/dashboard/projects/ProjectUI.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(Editor, {
      title: "Create project",
      fields: [{ name: "projectName", label: "Project name", required: true }],
      onSave: async () => {},
      onClose() {},
    }),
  );
  assert.match(html, /<dialog[^>]*aria-labelledby=/);
  assert.match(html, /<label/);
  assert.match(html, /required=""/);
  assert.match(html, /aria-label="Close dialog"/);
});
