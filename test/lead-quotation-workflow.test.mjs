import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFileSync(path, "utf8");
function load(path, client) {
  const exports = {};
  const code = ts.transpileModule(read(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(code, { exports, require: () => ({ default: client }) });
  return exports;
}

test("lead-to-quotation API workflow preserves identity, filtering, details and pagination", async () => {
  const lead = {
    id: "11111111-1111-4111-8111-111111111111",
    customerName: "Customer",
    email: "customer@example.com",
  };
  let stored;
  const client = {
    get: async (url, config) => {
      if (url === `/leads/${lead.id}`) return { data: lead };
      if (url === "/quotations") {
        assert.equal(config.params.leadId, lead.id);
        assert.equal(config.params.page, 2);
        assert.equal(config.params.limit, 5);
        return { data: { items: [stored], total: 6, page: 2, totalPages: 2 } };
      }
      assert.equal(url, "/quotations/quote-1");
      return { data: stored };
    },
    post: async (url, body) => {
      assert.equal(url, "/quotations");
      assert.equal(body.leadId, lead.id);
      stored = { ...body, id: "quote-1", lead, status: "PENDING_APPROVAL" };
      return { data: stored };
    },
  };
  const leads = load("src/components/dashboard/leads/leadApi.ts", client);
  const quotes = load("src/services/quotationsApi.ts", client);
  const selected = await leads.getLead(lead.id);
  const created = await quotes.createQuotation({
    leadId: selected.id,
    items: [{ itemName: "Work", quantity: 1, unitPrice: 100 }],
  });
  const listed = await quotes.listQuotations({
    leadId: selected.id,
    page: 2,
    limit: 5,
  });
  assert.equal(listed.items[0].id, created.id);
  assert.equal(listed.totalPages, 2);
  assert.equal(
    (await quotes.getQuotationById(created.id)).lead.email,
    lead.email,
  );
});

test("invalid lead and authorization failures propagate without fabricated records", async () => {
  for (const code of ["LEAD_NOT_FOUND", "VALIDATION_ERROR", "FORBIDDEN"]) {
    const error = Object.assign(new Error(code), { code });
    const client = {
      get: async () => {
        throw error;
      },
      post: async () => {
        throw error;
      },
    };
    const leads = load("src/components/dashboard/leads/leadApi.ts", client);
    const quotes = load("src/services/quotationsApi.ts", client);
    await assert.rejects(leads.getLead("missing"), (e) => e === error);
    await assert.rejects(
      quotes.createQuotation({ leadId: "missing", items: [] }),
      (e) => e === error,
    );
    await assert.rejects(
      quotes.listQuotations({ leadId: "missing" }),
      (e) => e === error,
    );
  }
});

test("lead entry point, preselection, locked association and validation are wired", () => {
  const panel = read("src/components/dashboard/leads/LeadQuotations.tsx");
  const dashboard = read(
    "src/components/dashboard/quotations/QuotationsDashboardClient.tsx",
  );
  assert.match(panel, /canCreateQuotation\(role\)/);
  assert.match(panel, /leadId=\$\{encodeURIComponent\(leadId\)\}/);
  assert.match(dashboard, /leadId: initialLeadId/);
  assert.match(dashboard, /lockedLead=\{!!initialLeadId\}/);
  assert.ok(
    dashboard.indexOf("await getLead(formValues.leadId.trim())") <
      dashboard.indexOf("await createQuotation({"),
  );
});
