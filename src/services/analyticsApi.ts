import apiClient from "@/lib/axios";
import { formatAnalyticsCompactCurrency } from "@/components/dashboard/analytics/analyticsUtils";
import type {
  AnalyticsDashboardData,
  AnalyticsFinanceTrendPoint,
  AnalyticsOverdueInvoiceItem,
  AnalyticsProjectProgressItem,
  AnalyticsRiskItem,
  AnalyticsSummaryMetric,
} from "@/types/analytics";
import type {
  DashboardRevenueKpisDto,
  DashboardSummaryDto,
} from "@/types/dashboard";

function formatDateForApi(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRecentMonthRanges(monthCount: number, now = new Date()) {
  return Array.from({ length: monthCount }, (_, index) => {
    const offset = monthCount - index - 1;
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return {
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(start),
      fromDate: formatDateForApi(start),
      toDate: formatDateForApi(end),
    };
  });
}

export async function getAnalyticsFinanceTrend(
  monthCount = 6,
): Promise<AnalyticsFinanceTrendPoint[]> {
  const ranges = getRecentMonthRanges(monthCount);
  return Promise.all(
    ranges.map(async (range) => {
      const response = await apiClient.get<DashboardRevenueKpisDto>(
        "/analytics/kpis/revenue",
        { params: { fromDate: range.fromDate, toDate: range.toDate } },
      );
      return {
        label: range.label,
        totalRevenue: response.data.totalRevenue,
        paidAmount: response.data.paidAmount,
        outstandingBalance: response.data.outstandingBalance,
      };
    }),
  );
}

export async function getAnalyticsSummary(): Promise<DashboardSummaryDto> {
  const response = await apiClient.get<DashboardSummaryDto>(
    "/analytics/dashboard/summary",
  );
  return response.data;
}

export async function getAnalyticsProjectProgress(): Promise<
  AnalyticsProjectProgressItem[]
> {
  const response = await apiClient.get<AnalyticsProjectProgressItem[]>(
    "/analytics/reports/project-completion",
    {
      params: {
        page: 1,
        limit: 8,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    },
  );
  return response.data;
}

export async function getAnalyticsOverdueInvoices(): Promise<
  AnalyticsOverdueInvoiceItem[]
> {
  const response = await apiClient.get<AnalyticsOverdueInvoiceItem[]>(
    "/analytics/reports/overdue-invoices",
    {
      params: {
        page: 1,
        limit: 3,
        sortBy: "dueDate",
        sortOrder: "asc",
      },
    },
  );
  return response.data;
}

function percentageTrend(value: number) {
  return value >= 70
    ? ("up" as const)
    : value > 0
      ? ("neutral" as const)
      : ("down" as const);
}

function buildPaymentAndSalesMetrics(
  summary: DashboardSummaryDto,
  trend: AnalyticsFinanceTrendPoint[],
): AnalyticsSummaryMetric[] {
  const latest = trend.at(-1);
  return [
    {
      id: "payments-collected",
      name: "Payments Collected",
      value: formatAnalyticsCompactCurrency(latest?.paidAmount ?? 0),
      delta: "Latest month",
      trend: (latest?.paidAmount ?? 0) > 0 ? "up" : "neutral",
      points: trend.map((point) => point.paidAmount),
    },
    {
      id: "outstanding-balance",
      name: "Outstanding Balance",
      value: formatAnalyticsCompactCurrency(summary.revenue.outstandingBalance),
      delta: `${summary.invoices.overdueCount} overdue`,
      trend: summary.revenue.outstandingBalance > 0 ? "down" : "neutral",
      points: trend.map((point) => point.outstandingBalance),
    },
    {
      id: "lead-conversion",
      name: "Lead Conversion",
      value: `${summary.sales.convertedLeads} / ${summary.sales.totalLeads} leads`,
      delta: `${summary.sales.leadConversionRate.toFixed(1)}%`,
      trend: percentageTrend(summary.sales.leadConversionRate),
      points: [summary.sales.totalLeads, summary.sales.convertedLeads],
    },
    {
      id: "quotation-summary",
      name: "Quotation Approvals",
      value: `${summary.sales.quotationApprovalCount} / ${summary.sales.totalQuotations}`,
      delta: `${summary.sales.convertedQuotationCount} converted`,
      trend: summary.sales.quotationApprovalCount > 0 ? "up" : "neutral",
      points: [
        summary.sales.totalQuotations,
        summary.sales.quotationApprovalCount,
        summary.sales.convertedQuotationCount,
      ],
    },
  ];
}

export function buildAnalyticsRiskItems(
  invoices: AnalyticsOverdueInvoiceItem[],
): AnalyticsRiskItem[] {
  return invoices.map((invoice) => {
    const level =
      invoice.daysOverdue >= 30 || invoice.outstandingAmount >= 1_000_000
        ? "HIGH"
        : invoice.daysOverdue >= 14 || invoice.outstandingAmount >= 250_000
          ? "MEDIUM"
          : "LOW";
    return {
      id: invoice.invoiceId,
      projectName: invoice.projectName,
      category: "Overdue Invoice Risk",
      confidence: Math.min(55 + invoice.daysOverdue, 98),
      summary: `${invoice.customerName} has an overdue invoice of ${formatAnalyticsCompactCurrency(invoice.outstandingAmount)} that is ${invoice.daysOverdue} days late.`,
      factors: [
        `${invoice.daysOverdue} days overdue`,
        formatAnalyticsCompactCurrency(invoice.outstandingAmount),
        invoice.invoiceNumber ?? "Draft invoice",
      ],
      level,
    };
  });
}

export function buildAnalyticsDashboardData(
  summary: DashboardSummaryDto,
  trend: AnalyticsFinanceTrendPoint[],
  projectProgress: AnalyticsProjectProgressItem[],
  riskItems: AnalyticsRiskItem[],
): AnalyticsDashboardData {
  return {
    kpis: [
      {
        id: "active-projects",
        label: "Active Projects",
        value: String(summary.projects.activeProjectCount),
        note: `${summary.projects.completionRate.toFixed(1)}% completion rate`,
        tone: "success",
      },
      {
        id: "delayed-projects",
        label: "Delayed Projects",
        value: String(summary.projects.overdueProjectCount),
        note: "Projects past target end date",
        tone: summary.projects.overdueProjectCount > 0 ? "warning" : "success",
      },
      {
        id: "revenue-period",
        label: "Revenue This Period",
        value: formatAnalyticsCompactCurrency(summary.revenue.totalRevenue),
        note: `${formatAnalyticsCompactCurrency(summary.revenue.paidAmount)} collected`,
        tone: "default",
      },
      {
        id: "outstanding-payments",
        label: "Outstanding Payments",
        value: formatAnalyticsCompactCurrency(
          summary.revenue.outstandingBalance,
        ),
        note: `${summary.invoices.overdueCount} overdue invoices`,
        tone: summary.revenue.outstandingBalance > 0 ? "warning" : "success",
      },
      {
        id: "sales-conversion",
        label: "Lead Conversion",
        value: `${summary.sales.leadConversionRate.toFixed(1)}%`,
        note: `${summary.sales.convertedLeads} converted leads`,
        tone: "info",
      },
    ],
    revenueSummary: {
      title: "Revenue Trend",
      subtitle: "Monthly invoiced revenue from analytics-service",
      points: trend.map((point) => ({
        month: point.label,
        value: point.totalRevenue,
        kind: "ACTUAL",
      })),
    },
    paymentTrendSummary: {
      title: "Payments and Sales",
      subtitle: "Monthly collections and current sales conversion",
      metrics: buildPaymentAndSalesMetrics(summary, trend),
    },
    projectStatusSummary: {
      title: "Project Status Summary",
      subtitle: "Execution health across the project portfolio",
      activeProjects: summary.projects.activeProjectCount,
      delayedProjects: summary.projects.overdueProjectCount,
      completionRate: `${summary.projects.completionRate.toFixed(1)}%`,
      notes: [],
    },
    projectProgress,
    riskSummary: {
      title: "AI Risk Predictions",
      subtitle: "Live overdue invoice alerts from analytics-service",
      totalAlerts: riskItems.length,
      items: riskItems,
    },
    exportAvailability: "unavailable",
  };
}
