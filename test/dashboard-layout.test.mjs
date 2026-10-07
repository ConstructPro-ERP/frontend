import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("dashboard nav config keeps prototype section structure", () => {
  const configSource = read("src/components/dashboard/dashboardConfig.ts");

  assert.match(configSource, /section: "Main"/);
  assert.match(configSource, /section: "Finance"/);
  assert.match(configSource, /section: "Management"/);
  assert.match(configSource, /title: "Dashboard"/);
  assert.match(configSource, /title: "Invoices & Payments"/);
  assert.match(configSource, /title: "Analytics & AI"/);
  assert.doesNotMatch(configSource, /badge:\s*"7"/);
});

test("dashboard shell wires shared header and sidebar with tighter content spacing", () => {
  const shellSource = read("src/components/dashboard/DashboardShell.tsx");

  assert.match(shellSource, /<DashboardSidebar/);
  assert.match(shellSource, /<DashboardHeader/);
  assert.match(
    shellSource,
    /className="flex-1 overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-4"/,
  );
});

test("dashboard header exposes the prototype search and notification actions", () => {
  const headerSource = read("src/components/dashboard/DashboardHeader.tsx");

  assert.match(headerSource, /searchPlaceholder: "Search anything\.\.\."/);
  assert.match(headerSource, /aria-label="Notifications"/);
  assert.doesNotMatch(headerSource, /Open account menu/);
});

test("dashboard sidebar uses the real logo and sidebar account popup actions", () => {
  const sidebarSource = read("src/components/dashboard/DashboardSidebar.tsx");

  assert.match(sidebarSource, /src="\/logos\/IsharaHomesLogo\.png"/);
  assert.match(sidebarSource, /Profile/);
  assert.match(sidebarSource, /Settings/);
  assert.match(sidebarSource, /Sign out/);
});

test("shared dashboard layout is applied to finance and analytics pages", () => {
  const layoutPath = "src/app/dashboard/layout.tsx";
  const financePagePath = "src/app/dashboard/finance/page.tsx";
  const analyticsPagePath = "src/app/dashboard/analytics/page.tsx";

  assert.equal(existsSync(path.join(root, layoutPath)), true);
  assert.equal(existsSync(path.join(root, financePagePath)), true);
  assert.equal(existsSync(path.join(root, analyticsPagePath)), true);

  const layoutSource = read(layoutPath);
  assert.match(layoutSource, /<DashboardShell>{children}<\/DashboardShell>/);
});

test("dashboard KPI cards use the typed backend summary integration", () => {
  const pageSource = read("src/app/dashboard/page.tsx");
  const clientSource = read("src/components/dashboard/DashboardKpiClient.tsx");
  const serviceSource = read("src/services/dashboardApi.ts");
  const typesSource = read("src/types/dashboard.ts");

  assert.match(pageSource, /DashboardKpiClient/);
  assert.doesNotMatch(pageSource, /LKR 48\.2M/);
  assert.match(
    serviceSource,
    /apiClient\.get<DashboardSummaryDto>\(\s*"\/analytics\/dashboard\/summary"/,
  );
  assert.match(typesSource, /DashboardRevenueKpisDto/);
  assert.match(typesSource, /DashboardProjectKpisDto/);
  assert.match(typesSource, /DashboardSalesKpisDto/);
  assert.match(clientSource, /Total Revenue/);
  assert.match(clientSource, /Paid Amount/);
  assert.match(clientSource, /Outstanding/);
  assert.match(clientSource, /Active Projects/);
  assert.match(clientSource, /Completion Rate/);
  assert.match(clientSource, /Total Leads/);
  assert.match(clientSource, /Total Quotations/);
});

test("dashboard KPI integration has loading, empty, error, and zero handling", () => {
  const clientSource = read("src/components/dashboard/DashboardKpiClient.tsx");
  const serviceSource = read("src/services/dashboardApi.ts");

  assert.match(clientSource, /Loading dashboard KPIs/);
  assert.match(clientSource, /No KPI data available/);
  assert.match(clientSource, /Dashboard KPIs unavailable/);
  assert.match(clientSource, /Try again/);
  assert.match(serviceSource, /summary\.revenue\.totalRevenue === 0/);
  assert.match(serviceSource, /summary\.projects\.totalProjects === 0/);
  assert.match(serviceSource, /summary\.sales\.totalLeads === 0/);
});
