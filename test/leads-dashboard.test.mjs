import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (file) => readFileSync(path.join(process.cwd(), file), "utf8");

test("leads API module covers the supplied backend routes", () => {
  const source = read("src/components/dashboard/leads/leadApi.ts");
  for (const route of ["/leads", "/assign", "/status", "/notes", "/contacts"]) assert.match(source, new RegExp(route));
  for (const method of ["apiClient.get", "apiClient.post", "apiClient.patch", "apiClient.del"]) assert.ok(source.includes(method));
});

test("leads dashboard loads live data and preserves preview fallback", () => {
  const source = read("src/components/dashboard/leads/LeadsDashboardClient.tsx");
  assert.match(source, /listLeads/);
  assert.match(source, /getLead/);
  assert.match(source, /createLeadRequest/);
  assert.match(source, /updateLeadStatus/);
  assert.match(source, /Showing the built-in preview data/);
});
