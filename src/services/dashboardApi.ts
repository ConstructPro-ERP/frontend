import apiClient from "@/lib/axios";
import type { DashboardSummaryDto } from "@/types/dashboard";

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
