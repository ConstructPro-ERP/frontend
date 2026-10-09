import apiClient from "@/lib/axios";
import type { DashboardSummaryDto } from "@/types/dashboard";
import type {
  DashboardActivity,
  DashboardActivityPage,
  DashboardProject,
  DashboardProjectStatus,
  DashboardRevenueKpisDto,
  DashboardRevenueMonth,
} from "@/types/dashboard";

export const dashboardStatuses: {
  status: DashboardProjectStatus;
  label: string;
  color: string;
}[] = [
  { status: "ACTIVE", label: "Active", color: "var(--dash-success)" },
  { status: "ON_HOLD", label: "On hold", color: "var(--dash-warning)" },
  { status: "PLANNING", label: "Planning", color: "var(--dash-info)" },
  { status: "COMPLETED", label: "Completed", color: "var(--dash-muted)" },
  { status: "CANCELLED", label: "Cancelled", color: "var(--dash-danger)" },
];

export async function getDashboardProjects(): Promise<DashboardProject[]> {
  const response = await apiClient.get<DashboardProject[]>(
    "/analytics/reports/project-completion",
    {
      params: {
        status: "ACTIVE",
        page: 1,
        limit: 5,
        sortBy: "endDate",
        sortOrder: "asc",
      },
    },
  );
  return response.data;
}

export async function getDashboardStatusCounts() {
  return Promise.all(
    dashboardStatuses.map(async (item) => {
      const response = await apiClient.get<DashboardProject[]>(
        "/analytics/reports/project-completion",
        {
          params: { status: item.status, page: 1, limit: 1 },
        },
      );
      if (typeof response.meta?.total !== "number")
        throw new Error("Project totals are unavailable.");
      return { ...item, count: response.meta.total };
    }),
  );
}

export async function getDashboardActivity(
  page = 1,
): Promise<DashboardActivityPage> {
  const response = await apiClient.get<DashboardActivity[]>(
    "/analytics/reports/recent-activity",
    { params: { page, limit: 5 } },
  );
  return {
    items: response.data,
    page: response.meta?.page ?? page,
    totalPages: response.meta?.totalPages ?? page,
  };
}

export async function getDashboardRevenue(): Promise<DashboardRevenueMonth[]> {
  const now = new Date();
  return Promise.all(
    Array.from({ length: 6 }, async (_, index) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const month = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
      const lastDay =
        index === 5
          ? now.getDate()
          : new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      const response = await apiClient.get<DashboardRevenueKpisDto>(
        "/analytics/kpis/revenue",
        {
          params: {
            fromDate: `${month}-01`,
            toDate: `${month}-${String(lastDay).padStart(2, "0")}`,
          },
        },
      );
      return {
        month,
        label: start.toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        }),
        revenue: response.data.totalRevenue,
        paid: response.data.paidAmount,
        outstanding: response.data.outstandingBalance,
      };
    }),
  );
}

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const response = await apiClient.get<DashboardSummaryDto>(
    "/analytics/dashboard/summary",
  );
  return response.data;
}

export function isDashboardSummaryEmpty(summary: DashboardSummaryDto) {
  return (
    summary.revenue.totalRevenue === 0 &&
    summary.revenue.paidAmount === 0 &&
    summary.revenue.outstandingBalance === 0 &&
    summary.projects.totalProjects === 0 &&
    summary.invoices.totalInvoices === 0 &&
    summary.sales.totalLeads === 0 &&
    summary.sales.totalQuotations === 0
  );
}
