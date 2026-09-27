import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (file) => readFileSync(path.join(process.cwd(), file), "utf8");

test("leads API module covers the supplied backend routes", () => {
  const source = read("src/components/dashboard/leads/leadApi.ts");
  for (const route of ["/leads", "/assign", "/status", "/notes", "/contacts"])
    assert.match(source, new RegExp(route));
  for (const method of [
    "apiClient.get",
    "apiClient.post",
    "apiClient.patch",
    "apiClient.del",
  ])
    assert.ok(source.includes(method));
});

test("leads dashboard loads live data without substituting preview records", () => {
  const source = read(
    "src/components/dashboard/leads/LeadsDashboardClient.tsx",
  );
  assert.match(source, /listLeads/);
  assert.match(source, /getLead/);
  assert.match(source, /createLeadRequest/);
  assert.match(source, /updateLeadStatus/);
  assert.doesNotMatch(source, /initialLeads|usingPreview/);
});

import ts from "typescript";
import vm from "node:vm";

function loadApi(response) {
  const exports = {};
  const calls = [];
  const client = Object.fromEntries(
    ["get", "post", "patch", "del"].map((method) => [
      method,
      async (...args) => {
        calls.push({ method, args });
        return typeof response === "function" ? response(...args) : response;
      },
    ]),
  );
  const code = ts.transpileModule(
    read("src/components/dashboard/leads/leadApi.ts"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(code, { exports, require: () => ({ default: client }) });
  return { api: exports, calls };
}
const record = {
  id: "lead-1",
  customerName: "IShara",
  phone: "+94774455123",
  email: "example@gmail.com",
  assignedToId: null,
  status: "NEW",
  createdAt: "2026-09-07T14:03:57.859Z",
  updatedAt: "2026-09-07T14:03:57.859Z",
  assignedTo: null,
  notes: [],
  contacts: [],
  customer: null,
};

test("assignee lookup reads all user pages and preserves backend IDs", async () => {
  const { api, calls } = loadApi((_url, config) => ({
    data: {
      items:
        config.params.page === 1
          ? [
              {
                id: "user-1",
                fullName: "Sales Manager",
                email: "sales@example.com",
              },
            ]
          : [{ id: "user-2", firstName: "John", lastName: "Silva" }],
      meta: { totalPages: 2 },
    },
  }));
  const users = await api.listLeadAssignees();
  assert.equal(users.length, 2);
  assert.equal(users[0].id, "user-1");
  assert.equal(users[1].fullName, "John Silva");
  assert.equal(calls[0].args[0], "/users");
  assert.equal(calls[1].args[1].params.page, 2);
});

test("assignee lookup supports a bare array and reports malformed responses", async () => {
  const { api } = loadApi([{ id: "user-1", email: "sales@example.com" }]);
  assert.equal((await api.listLeadAssignees())[0].email, "sales@example.com");
  const malformed = loadApi({ data: { unexpected: true } });
  await assert.rejects(malformed.api.listLeadAssignees(), /could not be read/);
});

test("maps the backend envelope, customer name, nullable relations and pagination", async () => {
  const meta = { total: 1, page: 1, limit: 100, totalPages: 1 };
  const response = { success: true, data: { data: [record], meta } };
  const { api } = loadApi(response);
  const { leads, meta: actualMeta } = await api.listLeads();
  assert.equal(leads.length, 1);
  assert.equal(leads[0].customerName, "IShara");
  for (const key of [
    "id",
    "phone",
    "email",
    "createdAt",
    "updatedAt",
    "assignedToId",
    "customer",
  ])
    assert.equal(leads[0][key], record[key]);
  assert.equal(leads[0].status, "NEW");
  assert.equal(leads[0].assignedTo, null);
  assert.equal(leads[0].notes.length, 0);
  assert.equal(leads[0].contacts.length, 0);
  assert.deepEqual(actualMeta, meta);
  assert.equal(api.normalizeLeads(response).length, 1);
  assert.equal(
    api.normalizeLeads({ data: { data: [], meta: { total: 0 } } }).length,
    0,
  );
});

test("maps populated notes, contacts, assignment and customer", () => {
  const { api } = loadApi({});
  const lead = api.normalizeLead({
    ...record,
    assignedToId: "user-1",
    assignedTo: { fullName: "Sales Person" },
    notes: [
      { id: "note-1", content: "Call tomorrow", createdAt: record.createdAt },
    ],
    contacts: [{ id: "contact-1", label: "whatsapp", value: "+94774455123" }],
    customer: { id: "customer-1", fullName: "IShara" },
  });
  assert.equal(lead.notes[0].content, "Call tomorrow");
  assert.equal(lead.notes[0].createdAt, record.createdAt);
  assert.equal(lead.contacts[0].label, "whatsapp");
  assert.equal(lead.contacts[0].value, record.phone);
  assert.equal(lead.assignedTo.fullName, "Sales Person");
  assert.equal(lead.customer.id, "customer-1");
});

test("assignment and note requests use backend DTO field names", async () => {
  const { api, calls } = loadApi({ data: record });
  await api.assignLead("lead-1", "user-1");
  await api.addLeadNote("lead-1", "Call tomorrow");
  assert.equal(calls[0].args[1].assignedToId, "user-1");
  assert.equal(calls[1].args[1].content, "Call tomorrow");
});

test("creating a note sends its content and actor and returns the saved note", async () => {
  const note = {
    id: "note-1",
    leadId: "lead-1",
    content: "Client is interested.\nCall tomorrow.",
    authorId: "user-1",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  const { api, calls } = loadApi({ data: note });
  const saved = await api.addLeadNote("lead-1", note.content, "user-1");
  assert.equal(calls[0].method, "post");
  assert.equal(calls[0].args[0], "/leads/lead-1/notes");
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].args[1])), {
    content: note.content,
  });
  assert.equal(calls[0].args[2].headers["x-user-id"], "user-1");
  assert.deepEqual(JSON.parse(JSON.stringify(saved)), note);
  await api.addLeadNote("lead-1", "Another note");
  assert.equal(calls[1].args[2], undefined);
});

test("creating a note preserves backend failures", async () => {
  const error = new Error("Unable to create note.");
  const { api } = loadApi(() => {
    throw error;
  });
  await assert.rejects(
    api.addLeadNote("lead-1", "Call tomorrow"),
    (actual) => actual === error,
  );
});

test("creation preserves every supplied response field without extra lead fields", async () => {
  const data = {
    ...record,
    id: "7b304116-3999-4515-b2bc-af78ae9e7a8e",
    customerName: "Nirmal",
    email: "NIrmal@gmail.com",
    assignedToId: "b390c2c8-86f5-484f-ad9f-170bca22703d",
    createdAt: "2026-09-08T05:53:36.500Z",
    updatedAt: "2026-09-08T05:53:36.500Z",
    assignedTo: {
      id: "b390c2c8-86f5-484f-ad9f-170bca22703d",
      fullName: "Admin User",
      email: "admin@constructpro.com",
    },
  };
  const { api } = loadApi({
    success: true,
    statusCode: 201,
    path: "/api/leads",
    timestamp: "2026-09-08T05:53:37.208Z",
    data,
  });
  const created = await api.createLead({
    customerName: data.customerName,
    phone: data.phone,
    email: data.email,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(created)), data);
  const nullable = api.normalizeLead({ ...record, phone: null, email: null });
  assert.equal(nullable.phone, null);
  assert.equal(nullable.email, null);
});

test("delete lead calls the DELETE endpoint and accepts an empty response", async () => {
  const { api, calls } = loadApi(undefined);
  await api.deleteLead("lead-1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "del");
  assert.equal(calls[0].args[0], "/leads/lead-1");
});

test("delete lead preserves backend errors for the dashboard", async () => {
  const error = new Error("You do not have permission to perform this action.");
  const { api } = loadApi(() => {
    throw error;
  });
  await assert.rejects(api.deleteLead("lead-1"), (actual) => actual === error);
});

test("delete lead permits only ADMIN from the profile", () => {
  const exports = {};
  const code = ts.transpileModule(
    read("src/components/dashboard/leads/leadPermissions.ts"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  vm.runInNewContext(code, { exports });
  const { canDeleteLead } = exports;
  assert.equal(canDeleteLead({ role: "ADMIN" }), true);
  assert.equal(canDeleteLead({ roles: ["CLIENT", "ADMIN"] }), true);
  for (const user of [
    null,
    undefined,
    {},
    { role: "SALES_MANAGER" },
    { role: "CLIENT" },
    { role: "ENGINEER" },
    { roles: [] },
    { roles: ["SALES_MANAGER", "CLIENT"] },
  ]) {
    assert.equal(canDeleteLead(user), false);
  }
});

test("capture lead permits only ADMIN or SALES_MANAGER from the profile", () => {
  const exports = {};
  const code = ts.transpileModule(
    read("src/components/dashboard/leads/leadPermissions.ts"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  vm.runInNewContext(code, { exports });
  const { canCaptureLead } = exports;
  for (const role of ["ADMIN", "SALES_MANAGER"]) {
    assert.equal(canCaptureLead({ role }), true);
    assert.equal(canCaptureLead({ roles: ["CLIENT", role] }), true);
  }
  for (const user of [
    null,
    undefined,
    {},
    { role: "MANAGER" },
    { role: "CLIENT" },
    { roles: [] },
    { roles: ["ENGINEER"] },
  ])
    assert.equal(canCaptureLead(user), false);
});
