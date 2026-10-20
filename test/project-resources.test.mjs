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

function loader(api = {}, states, externals = {}) {
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
          if (Object.hasOwn(externals, specifier)) return externals[specifier];
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

test("document categories use the shared backend category route", async () => {
  const categories = [{ id: milestoneId, categoryName: "Drawings" }];
  const api = loader({
    get: async (url) => {
      assert.equal(url, "/document-categories");
      return { data: categories };
    },
  })("src/services/documentsApi.ts");
  assert.deepEqual(await api.listDocumentCategories(), categories);
});

test("expense cards use the API total across all pages and calculate remaining budget", () => {
  const format = (value) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(value);
  for (const { budget, total, remaining } of [
    { budget: 100000, total: "70500.00", remaining: 29500 },
    { budget: 100000, total: "0.00", remaining: 100000 },
    { budget: 50000, total: "70500.00", remaining: -20500 },
    { budget: 0.3, total: "0.10", remaining: 0.2 },
    { budget: null, total: "70500.00", remaining: null },
  ]) {
    const Expenses = loader({}, [
      { total, byCategory: [{ category: null, amount: total }] },
      { data: [], meta: { page: 1, total: 20, totalPages: 2 } },
    ])("src/components/dashboard/projects/ExpensesSection.tsx").default;
    const html = renderToStaticMarkup(
      React.createElement(Expenses, {
        projectId: "project",
        budget,
        canWrite: false,
        canDelete: false,
      }),
    );
    assert.ok(
      html.includes(
        `Total expenses</p><p class="mt-2 text-lg font-bold">${format(Number(total))}</p>`,
      ),
    );
    assert.ok(
      html.includes(
        `Remaining budget</p><p class="mt-2 text-lg font-bold">${remaining === null ? "Not available" : format(remaining)}</p>`,
      ),
    );
    assert.match(html, /Uncategorized/);
    assert.doesNotMatch(html, /NaN/);
  }
});

test("expenses display the backend-provided creator name", () => {
  const Expenses = loader({}, [
    {
      total: "125.50",
      byCategory: [{ category: "Materials", amount: "125.50" }],
    },
    {
      data: [
        {
          id: "expense-1",
          projectId: "project-1",
          amount: "125.50",
          category: "Materials",
          description: "Foundation materials",
          expenseDate: "2026-10-18T00:00:00.000Z",
          recordedById: managerId,
          recordedBy: {
            id: managerId,
            fullName: "Test Accountant",
          },
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    },
  ])("src/components/dashboard/projects/ExpensesSection.tsx").default;

  const html = renderToStaticMarkup(
    React.createElement(Expenses, {
      projectId: "project-1",
      budget: 1000,
      canWrite: false,
      canDelete: false,
    }),
  );

  assert.match(html, /Recorded by/);
  assert.match(html, /Test Accountant/);
  assert.match(html, /Foundation materials/);
  assert.doesNotMatch(html, /Not available/);
  assert.doesNotMatch(html, /Edit expense/);
});

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

test("milestones require valid weight and date", () => {
  const valid = {
    milestoneName: "Foundation",
    weight: "3",
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
    { dueDate: "2026-02-30" },
    { description: "x".repeat(2001) },
  ])
    assert.ok(rules.validateMilestone({ ...valid, ...invalid }));
});

test("milestone metadata and progress use separate DTOs", async () => {
  const calls = [];

  const api = loader({
    post: async (url, body) => {
      calls.push(["post", url, body]);
      return { data: {} };
    },
    patch: async (url, body) => {
      calls.push(["patch", url, body]);
      return { data: {} };
    },
  })("src/services/milestonesApi.ts");

  const metadata = {
    milestoneName: "Foundation",
    description: "Foundation works",
    dueDate: null,
    weight: 5,
  };

  await api.createMilestone("project", metadata);
  await api.updateMilestone("milestone", metadata);
  await api.updateMilestoneProgress("milestone", 100);

  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["post", "/projects/project/milestones", metadata],
    ["patch", "/milestones/milestone", metadata],
    ["patch", "/milestones/milestone/progress", { progressPercentage: 100 }],
  ]);
});

test("milestone progress accepts whole-number boundaries and rejects empty or fractional input", () => {
  for (const progress of ["0", "50", "100"])
    assert.equal(rules.validateMilestoneProgress({ progress }), null);
  for (const progress of ["", " ", "-1", "101", "1.5", "Infinity"])
    assert.ok(rules.validateMilestoneProgress({ progress }));
});

test("milestone listing filters, sorts and paginates the complete backend array", async () => {
  const milestones = Array.from({ length: 23 }, (_, index) => {
    const number = index + 1;
    const suffix = String(number).padStart(2, "0");

    return {
      id: `milestone-${suffix}`,
      projectId: "project",
      milestoneName: `Foundation ${suffix}`,
      description: `Construction stage ${suffix}`,
      createdAt: `2026-10-${suffix}T00:00:00.000Z`,
      dueDate: null,
      weight: 1,
      progressPercentage: number % 2 === 0 ? 0 : 65,
      status: number % 2 === 0 ? "PENDING" : "IN_PROGRESS",
    };
  });

  const calls = [];

  const api = loader({
    get: async (url, config) => {
      calls.push({ url, config });
      return { data: milestones };
    },
  })("src/services/milestonesApi.ts");

  const first = await api.listMilestones("project", {
    page: 1,
    limit: 10,
    sortBy: "milestoneName",
    sortOrder: "asc",
  });

  const second = await api.listMilestones("project", {
    page: 2,
    limit: 10,
    sortBy: "milestoneName",
    sortOrder: "asc",
  });

  const last = await api.listMilestones("project", {
    page: 3,
    limit: 10,
    sortBy: "milestoneName",
    sortOrder: "asc",
  });

  assert.deepEqual(JSON.parse(JSON.stringify(first.meta)), {
    page: 1,
    limit: 10,
    total: 23,
    totalPages: 3,
  });

  assert.equal(first.data.length, 10);
  assert.equal(second.data.length, 10);
  assert.equal(last.data.length, 3);

  assert.equal(first.data[0].id, "milestone-01");
  assert.equal(second.data[0].id, "milestone-11");
  assert.equal(last.data[0].id, "milestone-21");

  const descending = await api.listMilestones("project", {
    sortBy: "milestoneName",
    sortOrder: "desc",
  });

  assert.equal(descending.data[0].id, "milestone-23");

  const filtered = await api.listMilestones("project", {
    search: "FOUNDATION 1",
    status: "PENDING",
  });

  assert.equal(filtered.meta.total, 5);
  assert.equal(filtered.meta.totalPages, 1);

  const empty = await api.listMilestones("project", {
    search: "Nonexistent milestone",
  });

  assert.equal(empty.data.length, 0);
  assert.equal(empty.meta.total, 0);

  // Milestone pagination is local. The backend must receive no
  // unsupported pagination, search, or sorting query parameters.
  for (const call of calls) {
    assert.equal(call.url, "/projects/project/milestones");
    assert.equal(call.config, undefined);
  }
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

test("expenses follow backend amount, metadata and date constraints", () => {
  const valid = {
    amount: "100.25",
    category: "Materials",
    date: "2026-10-13",
    description: "Concrete materials",
  };

  assert.equal(rules.validateExpense(valid), null);
  assert.equal(
    rules.validateExpense({ ...valid, category: "", description: "" }),
    null,
  );

  assert.equal(
    rules.validateExpense({ ...valid, amount: "9999999999.99" }),
    null,
  );

  for (const amount of [
    "0",
    "0.00",
    "-1",
    "1e3",
    "1.001",
    "10000000000",
    "01.50",
    "Infinity",
    "",
  ]) {
    assert.ok(rules.validateExpense({ ...valid, amount }));
  }

  assert.ok(rules.validateExpense({ ...valid, category: "x".repeat(101) }));
  assert.ok(rules.validateExpense({ ...valid, description: "x".repeat(1001) }));
  assert.ok(rules.validateExpense({ ...valid, date: "2026-02-29" }));

  assert.equal(
    rules.validateDateFilters({
      fromDate: "2026-10-13",
      toDate: "2026-10-13",
    }),
    null,
  );

  assert.ok(
    rules.validateDateFilters({
      fromDate: "2026-10-14",
      toDate: "2026-10-13",
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

test("document validation accepts construction file formats", () => {
  const supported = [
    "drawing.dwg",
    "drawing.dxf",
    "model.rvt",
    "family.rfa",
    "building.ifc",
    "design.max",
    "scene.lsf",
    "legacy.ls12",
    "model.skp",
    "model.fbx",
    "model.blend1",
    "spreadsheet.xlsx",
    "presentation.pptx",
    "archive.zip",
    "render.webp",
    "survey.tiff",
  ];

  for (const name of supported) {
    assert.equal(
      documentRules.validateDocumentFile({
        name,
        size: 1024,
      }),
      null,
      `Expected ${name} to be supported`,
    );
  }

  assert.equal(documentRules.MAX_DOCUMENT_BYTES, 50 * 1024 * 1024);

  assert.equal(
    documentRules.validateDocumentFile({
      name: "large-model.rvt",
      size: 50 * 1024 * 1024,
    }),
    null,
  );

  assert.match(
    documentRules.validateDocumentFile({
      name: "oversized.rvt",
      size: 50 * 1024 * 1024 + 1,
    }),
    /50 MiB/,
  );

  for (const name of ["program.exe", "script.js", "file.svg"]) {
    assert.ok(
      documentRules.validateDocumentFile({
        name,
        size: 1024,
      }),
    );
  }
});

test("document MIME handling matches backend upload requirements", () => {
  assert.equal(
    documentRules.documentMimeType({
      name: "drawing.pdf",
      type: "",
    }),
    "application/pdf",
  );

  assert.equal(
    documentRules.documentMimeType({
      name: "building.rvt",
      type: "",
    }),
    "application/octet-stream",
  );

  assert.equal(
    documentRules.documentMimeType({
      name: "render.webp",
      type: "",
    }),
    "image/webp",
  );

  assert.equal(
    documentRules.documentMimeType({
      name: "model.fbx",
      type: "model/fbx",
    }),
    "model/fbx",
  );

  assert.ok(
    documentRules.validateDocumentFile({
      name: "drawing.pdf",
      size: 1024,
      type: "text/plain",
    }),
  );
});

test("document metadata validation covers descriptions and filename safety", () => {
  const valid = {
    fileName: "Approved Plan.pdf",
    categoryId: milestoneId,
    description: "Final structural drawing",
  };

  assert.equal(documentRules.validateDocumentMetadata(valid), null);

  assert.equal(
    documentRules.validateDocumentMetadata({
      ...valid,
      description: null,
    }),
    null,
  );

  for (const description of [" ", "x".repeat(1001)]) {
    assert.ok(
      documentRules.validateDocumentMetadata({
        ...valid,
        description,
      }),
    );
  }

  for (const fileName of [
    " Plan.pdf",
    "Plan.pdf ",
    "../Plan.pdf",
    "Plan\n.pdf",
  ]) {
    assert.ok(
      documentRules.validateDocumentMetadata({
        ...valid,
        fileName,
      }),
    );
  }
});

test("small documents use the legacy multipart endpoint without automatic retries", async () => {
  const progress = [];
  const file = new File(["plan"], "plan.pdf", {
    type: "application/pdf",
  });

  const api = loader({
    post: async (url, body, config) => {
      assert.equal(url, "/projects/project%2Fone/documents");
      assert.equal(body.get("file").name, "plan.pdf");
      assert.equal(body.get("categoryId"), milestoneId);
      assert.equal(body.has("uploadedById"), false);

      assert.equal(config.headers["Content-Type"], "multipart/form-data");

      assert.equal(config.skipNetworkRetry, true);
      assert.equal(config.headers["Idempotency-Key"], undefined);

      config.onUploadProgress({ loaded: 2, total: 4 });

      return { data: { id: "document-1" } };
    },
  })("src/services/documentsApi.ts");

  const result = await api.uploadDocument(
    "project/one",
    file,
    milestoneId,
    (value) => progress.push(value),
  );

  assert.equal(result.id, "document-1");
  assert.deepEqual(progress, [50]);
});

test("legacy uploads normalize missing MIME types", async () => {
  const file = new File(["%PDF-1.7\n"], "plan.pdf", {
    type: "",
  });

  const api = loader({
    post: async (url, body) => {
      assert.equal(url, "/projects/project/documents");
      assert.equal(body.get("file").name, "plan.pdf");
      assert.equal(body.get("file").type, "application/pdf");

      return { data: { id: "document-1" } };
    },
  })("src/services/documentsApi.ts");

  const result = await api.uploadDocument("project", file, milestoneId);

  assert.equal(result.id, "document-1");
});

test("documents at the 3 MiB threshold use multipart upload", async () => {
  const size = 3 * 1024 * 1024;
  const file = new File([new Uint8Array(size)], "drawing.rvt", {
    type: "application/octet-stream",
  });

  assert.equal(documentRules.LEGACY_DOCUMENT_UPLOAD_THRESHOLD_BYTES, size);

  let calls = 0;

  const api = loader({
    post: async (url, body, config) => {
      calls += 1;

      assert.equal(url, "/projects/project/documents");
      assert.equal(body.get("file").size, size);
      assert.equal(config.skipNetworkRetry, true);

      return { data: { id: "legacy-document" } };
    },
  })("src/services/documentsApi.ts");

  const result = await api.uploadDocument("project", file, milestoneId);

  assert.equal(result.id, "legacy-document");
  assert.equal(calls, 1);
});

test("larger documents use signed Cloudinary upload before backend completion", async () => {
  const file = new File([new Uint8Array(3 * 1024 * 1024 + 1)], "building.rvt", {
    type: "application/octet-stream",
  });

  const publicId = "constructpro/projects/project/doc-1.rvt";

  const authorization = {
    documentId: "doc-1",
    cloudName: "test-cloud",
    apiKey: "test-public-key",
    publicId,
    resourceType: "raw",
    timestamp: 1234567890,
    signature: "backend-generated-signature",
    uploadParameters: {
      public_id: publicId,
      timestamp: 1234567890,
      type: "authenticated",
      overwrite: "false",
    },
  };

  const calls = [];
  const progress = [];

  const backend = {
    post: async (url, body, config) => {
      calls.push(url);

      if (url.endsWith("/upload-authorizations")) {
        assert.deepEqual(JSON.parse(JSON.stringify(body)), {
          categoryId: milestoneId,
          fileName: "building.rvt",
          mimeType: "application/octet-stream",
          fileSize: file.size,
        });

        assert.equal(config.skipNetworkRetry, true);

        return { data: authorization };
      }

      assert.equal(url, "/projects/project/documents/doc-1/complete");

      assert.deepEqual(JSON.parse(JSON.stringify(body)), {});

      return { data: { id: "doc-1", fileName: "building.rvt" } };
    },
  };

  const cloudinaryAxios = {
    __esModule: true,
    default: {
      create: (configuration) => {
        assert.equal(configuration.withCredentials, false);

        return {
          post: async (url, form, config) => {
            calls.push("cloudinary");

            assert.equal(
              url,
              "https://api.cloudinary.com/v1_1/test-cloud/raw/upload",
            );

            assert.equal(form.get("file").size, file.size);
            assert.equal(form.get("public_id"), publicId);
            assert.equal(form.get("api_key"), authorization.apiKey);
            assert.equal(form.get("signature"), authorization.signature);
            assert.equal(form.get("type"), "authenticated");
            assert.equal(form.get("overwrite"), "false");

            assert.equal(config.headers?.Authorization, undefined);

            config.onUploadProgress({
              loaded: file.size / 2,
              total: file.size,
            });

            config.onUploadProgress({
              loaded: file.size,
              total: file.size,
            });

            return {
              data: {
                public_id: publicId,
                resource_type: "raw",
                type: "authenticated",
                bytes: file.size,
              },
            };
          },
        };
      },
    },
  };

  const api = loader(backend, undefined, {
    axios: cloudinaryAxios,
  })("src/services/documentsApi.ts");

  const result = await api.uploadDocument(
    "project",
    file,
    milestoneId,
    (value) => progress.push(value),
  );

  assert.equal(result.id, "doc-1");

  assert.deepEqual(calls, [
    "/projects/project/documents/upload-authorizations",
    "cloudinary",
    "/projects/project/documents/doc-1/complete",
  ]);

  assert.deepEqual(progress, [50, 100]);
});

test("direct uploads do not complete when Cloudinary returns inconsistent metadata", async () => {
  const file = new File([new Uint8Array(3 * 1024 * 1024 + 1)], "building.rvt", {
    type: "application/octet-stream",
  });

  const publicId = "constructpro/projects/project/doc-2.rvt";
  let completionCalled = false;

  const authorization = {
    documentId: "doc-2",
    cloudName: "test-cloud",
    apiKey: "test-public-key",
    publicId,
    resourceType: "raw",
    timestamp: 1234567890,
    signature: "backend-generated-signature",
    uploadParameters: {
      public_id: publicId,
      timestamp: 1234567890,
      type: "authenticated",
      overwrite: "false",
    },
  };

  const api = loader(
    {
      post: async (url) => {
        if (url.endsWith("/upload-authorizations")) {
          return { data: authorization };
        }

        completionCalled = true;
        return { data: { id: "doc-2" } };
      },
    },
    undefined,
    {
      axios: {
        __esModule: true,
        default: {
          create: () => ({
            post: async () => ({
              data: {
                public_id: publicId,
                resource_type: "raw",
                type: "authenticated",
                bytes: file.size - 1,
              },
            }),
          }),
        },
      },
    },
  )("src/services/documentsApi.ts");

  await assert.rejects(
    api.uploadDocument("project", file, milestoneId),
    /unexpected document upload metadata/,
  );

  assert.equal(completionCalled, false);
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
    /This file format is not supported\./,
  );
  assert.equal(calls, 0);
});

test("document requests preserve filters, metadata, delete path and download URL", async () => {
  const calls = [];
  const api = loader({
    get: async (url, config) => {
      calls.push({ url, params: config?.params });
      return url.endsWith("/download")
        ? {
            data: {
              downloadUrl: "https://storage.example/plan.pdf?token=signed",
              expiresInSeconds: 300,
            },
          }
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
    const api = loader({
      get: async () => ({
        data: {
          downloadUrl: url,
          expiresInSeconds: 300,
        },
      }),
    })("src/services/documentsApi.ts");
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
          fileSize: 1024,
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
  assert.match(html, /Maximum 50 MiB/);
  assert.match(html, /up to 3 MiB/);
  assert.match(html, /CAD, Revit, Lumion/);
});
