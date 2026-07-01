import { ApiError } from "@/lib/ApiError";
import type {
  AnalyticsAiPredictionResult,
  AnalyticsAiProjectOption,
  AnalyticsDashboardData,
  AnalyticsExportAvailability,
  AnalyticsKpiCard,
  AnalyticsKpiTone,
  AnalyticsRevenuePoint,
  AnalyticsRiskItem,
  AnalyticsRiskLevel,
  AnalyticsSummaryMetric,
} from "@/types/analytics";

export const analyticsPreviewData: AnalyticsDashboardData = {
  kpis: [
    {
      id: "active-projects",
      label: "Active Projects",
      value: "14",
      note: "68% average completion across live sites",
      tone: "success",
    },
    {
      id: "delayed-projects",
      label: "Delayed Projects",
      value: "3",
      note: "Two site schedules need immediate recovery plans",
      tone: "warning",
    },
    {
      id: "revenue-period",
      label: "Revenue This Period",
      value: "LKR 10.1M",
      note: "April remains the strongest recognized month",
      tone: "default",
    },
    {
      id: "outstanding-payments",
      label: "Outstanding Payments",
      value: "LKR 6.8M",
      note: "Five invoices remain open with two long-overdue",
      tone: "warning",
    },
    {
      id: "high-risk-projects",
      label: "High-Risk Projects",
      value: "3",
      note: "Projects with payment, schedule, or cost pressure",
      tone: "danger",
    },
  ],
  revenueSummary: {
    title: "Revenue Trend - 2026",
    subtitle: "Monthly revenue in LKR millions",
    points: [
      { month: "Jan", value: 6_200_000, kind: "ACTUAL" },
      { month: "Feb", value: 7_600_000, kind: "ACTUAL" },
      { month: "Mar", value: 5_300_000, kind: "ACTUAL" },
      { month: "Apr", value: 10_100_000, kind: "ACTUAL" },
      { month: "May", value: 7_000_000, kind: "PROJECTED" },
      { month: "Jun", value: 7_500_000, kind: "PROJECTED" },
      { month: "Jul", value: 8_000_000, kind: "PROJECTED" },
      { month: "Aug", value: 6_500_000, kind: "PROJECTED" },
      { month: "Sep", value: 5_500_000, kind: "PROJECTED" },
      { month: "Oct", value: 8_500_000, kind: "PROJECTED" },
      { month: "Nov", value: 9_000_000, kind: "PROJECTED" },
      { month: "Dec", value: 10_000_000, kind: "PROJECTED" },
    ],
  },
  paymentTrendSummary: {
    title: "Performance Metrics",
    subtitle: "Key indicators vs targets",
    metrics: [
      {
        id: "lead-conversion",
        name: "Lead Conversion",
        value: "9 / 23 leads",
        delta: "+39%",
        trend: "up",
        points: [28, 22, 25, 16, 12, 8, 6],
      },
      {
        id: "project-duration",
        name: "Avg Project Duration",
        value: "7.2 months",
        delta: "+0.4mo",
        trend: "down",
        points: [8, 10, 14, 18, 20, 22],
      },
      {
        id: "payment-on-time",
        name: "Payment on Time",
        value: "87.6% rate",
        delta: "+4.2%",
        trend: "up",
        points: [20, 18, 14, 10, 8, 6],
      },
      {
        id: "cost-overruns",
        name: "Cost Overruns",
        value: "2 projects",
        delta: "+1",
        trend: "down",
        points: [10, 12, 16, 20, 24, 26],
      },
      {
        id: "client-satisfaction",
        name: "Client Satisfaction",
        value: "4.6 / 5.0",
        delta: "+0.2",
        trend: "up",
        points: [14, 12, 10, 8, 6, 5],
      },
    ],
  },
  projectStatusSummary: {
    title: "Project Status Summary",
    subtitle: "Execution health across active delivery work",
    activeProjects: 14,
    delayedProjects: 3,
    completionRate: "68%",
    notes: [
      "11 projects are progressing within planned milestone windows.",
      "3 projects are delayed because of payment lag, slow milestone velocity, or procurement pressure.",
      "The portfolio remains healthy, but two sites need schedule recovery this week.",
    ],
  },
  riskSummary: {
    title: "AI Risk Predictions",
    subtitle: "3 issues detected with high confidence",
    totalAlerts: 3,
    items: [
      {
        id: "sunset-residency",
        projectName: "Sunset Residency - Negombo",
        category: "Payment Delay Risk",
        confidence: 91,
        summary:
          "Client has a 28-day overdue invoice of LKR 2.2M. Historical pattern shows 2 previous late payments on this account. Project is also 3 weeks behind schedule, increasing financial stress indicators.",
        factors: ["Late payment history", "Schedule delay", "High balance"],
        level: "HIGH",
      },
      {
        id: "blue-horizon",
        projectName: "Blue Horizon - Galle",
        category: "Schedule Overrun Risk",
        confidence: 74,
        summary:
          "Milestone 3 (Upper Structure) is progressing 12% slower than planned velocity. Based on similar commercial projects, a 4-6 week overrun is likely if current pace continues through May.",
        factors: ["Slow milestone pace", "Commercial complexity"],
        level: "MEDIUM",
      },
      {
        id: "kandy-heights",
        projectName: "Kandy Heights - Phase II",
        category: "Budget Variance Risk",
        confidence: 52,
        summary:
          "Material costs in similar Kandy region projects have increased 8-12% over the past quarter. Early-stage projects are more vulnerable to inflation. Monitor procurement closely.",
        factors: ["Material cost trend", "Early stage"],
        level: "LOW",
      },
    ],
  },
  exportAvailability: "pending",
};

export const analyticsAiProjectPreviewOptions: AnalyticsAiProjectOption[] = [
  {
    id: "project-sunset-residency",
    name: "Sunset Residency - Negombo",
    status: "Delayed",
  },
  {
    id: "project-blue-horizon",
    name: "Blue Horizon - Galle",
    status: "In Progress",
  },
  {
    id: "project-kandy-heights",
    name: "Kandy Heights - Phase II",
    status: "Planning",
  },
];

export const analyticsAiPredictionPreview: AnalyticsAiPredictionResult = {
  overallRiskLevel: "High",
  milestoneDelayRisk:
    "74% risk of milestone slippage in the next 4 to 6 weeks.",
  paymentDelayRisk:
    "91% likelihood of delayed payment on the next major invoice.",
  revenueTrend:
    "Revenue is likely to soften next month unless overdue collections recover.",
  explanation:
    "Historical late payments, slower milestone velocity, and recent cost pressure are combining to increase delivery and cash-flow risk on the selected project.",
  recommendedAction:
    "Escalate client follow-up this week, re-baseline the next milestone plan, and review procurement commitments before approving the next spend window.",
};

export function formatAnalyticsCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `LKR ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
}

function readObject(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function readString(
  source: Record<string, unknown>,
  keys: string[],
  fallback = "",
) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
}

function readNumber(
  source: Record<string, unknown>,
  keys: string[],
  fallback = 0,
) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function normalizeKpiTone(value: unknown): AnalyticsKpiTone {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized === "success" ||
    normalized === "warning" ||
    normalized === "danger" ||
    normalized === "info"
  ) {
    return normalized;
  }

  return "default";
}

function normalizeRiskLevel(value: unknown): AnalyticsRiskLevel {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (
    normalized === "HIGH" ||
    normalized === "MEDIUM" ||
    normalized === "LOW"
  ) {
    return normalized;
  }

  return "LOW";
}

function normalizeExportAvailability(
  value: unknown,
): AnalyticsExportAvailability {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized === "available" ||
    normalized === "pending" ||
    normalized === "unavailable"
  ) {
    return normalized;
  }

  return "pending";
}

function normalizeKpis(payload: unknown): AnalyticsKpiCard[] {
  if (!Array.isArray(payload)) {
    return analyticsPreviewData.kpis;
  }

  const items = payload
    .map((entry, index) => {
      const record = readObject(entry);

      if (!record) {
        return null;
      }

      return {
        id: readString(record, ["id"], `kpi-${index}`),
        label: readString(record, ["label", "title", "name"], "Metric"),
        value: readString(record, ["value", "displayValue"], "0"),
        note: readString(record, ["note", "subtitle", "description"], ""),
        tone: normalizeKpiTone(record.tone),
      } satisfies AnalyticsKpiCard;
    })
    .filter((item): item is AnalyticsKpiCard => item !== null);

  return items.length > 0 ? items : analyticsPreviewData.kpis;
}

function normalizeRevenuePoints(payload: unknown): AnalyticsRevenuePoint[] {
  if (!Array.isArray(payload)) {
    return analyticsPreviewData.revenueSummary.points;
  }

  const points = payload
    .map((entry) => {
      const record = readObject(entry);

      if (!record) {
        return null;
      }

      return {
        month: readString(record, ["month", "label"], "N/A"),
        value: readNumber(record, ["value", "amount"], 0),
        kind:
          readString(record, ["kind", "type"], "ACTUAL").toUpperCase() ===
          "PROJECTED"
            ? "PROJECTED"
            : "ACTUAL",
      } satisfies AnalyticsRevenuePoint;
    })
    .filter((item): item is AnalyticsRevenuePoint => item !== null);

  return points.length > 0
    ? points
    : analyticsPreviewData.revenueSummary.points;
}

function normalizeSummaryMetrics(payload: unknown): AnalyticsSummaryMetric[] {
  if (!Array.isArray(payload)) {
    return analyticsPreviewData.paymentTrendSummary.metrics;
  }

  const metrics = payload
    .map((entry, index) => {
      const record = readObject(entry);

      if (!record) {
        return null;
      }

      const points = Array.isArray(record.points)
        ? record.points.filter(
            (value): value is number => typeof value === "number",
          )
        : [];

      const trend = readString(record, ["trend"], "neutral").toLowerCase();

      return {
        id: readString(record, ["id"], `metric-${index}`),
        name: readString(record, ["name", "label"], "Metric"),
        value: readString(record, ["value"], ""),
        delta: readString(record, ["delta", "change"], ""),
        trend: trend === "up" ? "up" : trend === "down" ? "down" : "neutral",
        points: points.length > 0 ? points : [24, 18, 12, 10, 6],
      } satisfies AnalyticsSummaryMetric;
    })
    .filter((item): item is AnalyticsSummaryMetric => item !== null);

  return metrics.length > 0
    ? metrics
    : analyticsPreviewData.paymentTrendSummary.metrics;
}

function normalizeRiskItems(payload: unknown): AnalyticsRiskItem[] {
  if (!Array.isArray(payload)) {
    return analyticsPreviewData.riskSummary.items;
  }

  const items = payload
    .map((entry, index) => {
      const record = readObject(entry);

      if (!record) {
        return null;
      }

      return {
        id: readString(record, ["id"], `risk-${index}`),
        projectName: readString(
          record,
          ["projectName", "project", "title"],
          "Unnamed project",
        ),
        category: readString(record, ["category", "type"], "Risk"),
        confidence: readNumber(record, ["confidence", "score"], 0),
        summary: readString(record, ["summary", "description"], ""),
        factors: Array.isArray(record.factors)
          ? record.factors.filter(
              (value): value is string =>
                typeof value === "string" && value.trim().length > 0,
            )
          : [],
        level: normalizeRiskLevel(record.level),
      } satisfies AnalyticsRiskItem;
    })
    .filter((item): item is AnalyticsRiskItem => item !== null);

  return items.length > 0 ? items : analyticsPreviewData.riskSummary.items;
}

function percentageTrend(value: number) {
  if (value >= 70) {
    return "up" as const;
  }

  if (value <= 30) {
    return "down" as const;
  }

  return "neutral" as const;
}

function buildMetricPoints(value: number): number[] {
  const clamped = Math.max(value, 0);
  return [
    Math.max(clamped * 0.45, 1),
    Math.max(clamped * 0.62, 1),
    Math.max(clamped * 0.75, 1),
    Math.max(clamped * 0.88, 1),
    Math.max(clamped, 1),
  ].map((point) => Math.round(point * 100) / 100);
}

function buildDashboardDataFromSummary(
  root: Record<string, unknown>,
): AnalyticsDashboardData {
  const revenue = readObject(root.revenue) ?? {};
  const projects = readObject(root.projects) ?? {};
  const invoices = readObject(root.invoices) ?? {};
  const sales = readObject(root.sales) ?? {};

  const totalRevenue = readNumber(revenue, ["totalRevenue"], 0);
  const paidAmount = readNumber(revenue, ["paidAmount"], 0);
  const outstandingBalance = readNumber(revenue, ["outstandingBalance"], 0);
  const activeProjectCount = readNumber(
    projects,
    ["activeProjectCount"],
    analyticsPreviewData.projectStatusSummary.activeProjects,
  );
  const overdueProjectCount = readNumber(
    projects,
    ["overdueProjectCount"],
    analyticsPreviewData.projectStatusSummary.delayedProjects,
  );
  const completionRateValue = readNumber(projects, ["completionRate"], 0);
  const totalLeads = readNumber(sales, ["totalLeads"], 0);
  const convertedLeads = readNumber(sales, ["convertedLeads"], 0);
  const leadConversionRate = readNumber(sales, ["leadConversionRate"], 0);
  const quotationApprovalCount = readNumber(
    sales,
    ["quotationApprovalCount"],
    0,
  );
  const convertedQuotationCount = readNumber(
    sales,
    ["convertedQuotationCount"],
    0,
  );
  const overdueInvoiceCount = readNumber(invoices, ["overdueCount"], 0);
  const paidInvoiceCount = readNumber(invoices, ["paidCount"], 0);
  const totalInvoiceCount = readNumber(invoices, ["totalInvoices"], 0);
  const collectionRate =
    totalRevenue <= 0 ? 0 : Math.round((paidAmount / totalRevenue) * 1000) / 10;

  return {
    kpis: [
      {
        id: "active-projects",
        label: "Active Projects",
        value: String(activeProjectCount),
        note: `${completionRateValue.toFixed(1)}% completion rate`,
        tone: "success",
      },
      {
        id: "delayed-projects",
        label: "Delayed Projects",
        value: String(overdueProjectCount),
        note: "Projects past target end date",
        tone: overdueProjectCount > 0 ? "warning" : "success",
      },
      {
        id: "revenue-period",
        label: "Revenue This Period",
        value: formatAnalyticsCompactCurrency(totalRevenue),
        note: `${formatAnalyticsCompactCurrency(paidAmount)} collected`,
        tone: "default",
      },
      {
        id: "outstanding-payments",
        label: "Outstanding Payments",
        value: formatAnalyticsCompactCurrency(outstandingBalance),
        note: `${overdueInvoiceCount} overdue invoices`,
        tone: outstandingBalance > 0 ? "warning" : "success",
      },
      {
        id: "high-risk-projects",
        label: "High-Risk Projects",
        value: String(overdueProjectCount + overdueInvoiceCount),
        note: "Live finance and delivery alerts",
        tone:
          overdueProjectCount + overdueInvoiceCount > 0 ? "danger" : "success",
      },
    ],
    revenueSummary: {
      title: "Revenue Snapshot",
      subtitle: "Current KPI totals for the selected reporting period",
      points: [
        { month: "Revenue", value: totalRevenue, kind: "ACTUAL" },
        { month: "Paid", value: paidAmount, kind: "ACTUAL" },
        { month: "Open", value: outstandingBalance, kind: "ACTUAL" },
      ],
    },
    paymentTrendSummary: {
      title: "Performance Metrics",
      subtitle: "Live KPI ratios from analytics-service",
      metrics: [
        {
          id: "lead-conversion",
          name: "Lead Conversion",
          value: `${convertedLeads} / ${totalLeads} leads`,
          delta: `${leadConversionRate.toFixed(1)}%`,
          trend: percentageTrend(leadConversionRate),
          points: buildMetricPoints(leadConversionRate),
        },
        {
          id: "project-completion",
          name: "Project Completion",
          value: `${completionRateValue.toFixed(1)}%`,
          delta: `${activeProjectCount} active`,
          trend: percentageTrend(completionRateValue),
          points: buildMetricPoints(completionRateValue),
        },
        {
          id: "invoice-collection",
          name: "Invoice Collection",
          value: `${collectionRate.toFixed(1)}%`,
          delta: `${paidInvoiceCount} paid`,
          trend: percentageTrend(collectionRate),
          points: buildMetricPoints(collectionRate),
        },
        {
          id: "quotation-approvals",
          name: "Quotation Approvals",
          value: String(quotationApprovalCount),
          delta: `${convertedQuotationCount} converted`,
          trend: quotationApprovalCount > 0 ? "up" : "neutral",
          points: buildMetricPoints(quotationApprovalCount || 1),
        },
        {
          id: "open-invoices",
          name: "Open Invoices",
          value: String(Math.max(totalInvoiceCount - paidInvoiceCount, 0)),
          delta: `${overdueInvoiceCount} overdue`,
          trend: overdueInvoiceCount > 0 ? "down" : "neutral",
          points: buildMetricPoints(
            Math.max(totalInvoiceCount - paidInvoiceCount, 1),
          ),
        },
      ],
    },
    projectStatusSummary: {
      title: "Project Status Summary",
      subtitle: "Execution health across active delivery work",
      activeProjects: activeProjectCount,
      delayedProjects: overdueProjectCount,
      completionRate: `${completionRateValue.toFixed(1)}%`,
      notes: [
        `${activeProjectCount} projects are active in the current reporting window.`,
        `${overdueProjectCount} projects are running past their planned end date.`,
        `${overdueInvoiceCount} overdue invoices are contributing to current risk visibility.`,
      ],
    },
    riskSummary: {
      title: "AI Risk Predictions",
      subtitle: "Waiting for a live analysis run",
      totalAlerts: overdueInvoiceCount,
      items: analyticsPreviewData.riskSummary.items,
    },
    exportAvailability: "unavailable",
  };
}

export function normalizeAnalyticsRiskItemsFromOverdueReport(
  payload: unknown,
): AnalyticsRiskItem[] {
  const root = readObject(payload);
  const records = Array.isArray(root?.items) ? root.items : [];

  const items = records
    .map((entry, index) => {
      const record = readObject(entry);

      if (!record) {
        return null;
      }

      const outstandingAmount = readNumber(record, ["outstandingAmount"], 0);
      const daysOverdue = readNumber(record, ["daysOverdue"], 0);
      const level: AnalyticsRiskLevel =
        daysOverdue >= 30 || outstandingAmount >= 1_000_000
          ? "HIGH"
          : daysOverdue >= 14 || outstandingAmount >= 250_000
            ? "MEDIUM"
            : "LOW";

      return {
        id: readString(record, ["invoiceId", "id"], `risk-${index}`),
        projectName: readString(record, ["projectName"], "Unnamed project"),
        category: "Overdue Invoice Risk",
        confidence: Math.min(55 + daysOverdue, 98),
        summary: `${readString(record, ["customerName"], "Client")} has an overdue invoice of ${formatAnalyticsCompactCurrency(outstandingAmount)}${daysOverdue > 0 ? ` that is ${daysOverdue} days late` : ""}.`,
        factors: [
          `${daysOverdue} days overdue`,
          formatAnalyticsCompactCurrency(outstandingAmount),
          readString(record, ["invoiceNumber"], "Invoice"),
        ],
        level,
      } satisfies AnalyticsRiskItem;
    })
    .filter((item): item is AnalyticsRiskItem => item !== null);

  return items.length > 0 ? items : analyticsPreviewData.riskSummary.items;
}

export function normalizeAnalyticsDashboardData(
  payload: unknown,
): AnalyticsDashboardData {
  const root = readObject(payload);

  if (!root) {
    return analyticsPreviewData;
  }

  if (root.revenue && root.projects && root.invoices && root.sales) {
    return buildDashboardDataFromSummary(root);
  }

  const revenueSummary = readObject(root.revenueSummary);
  const paymentTrendSummary = readObject(root.paymentTrendSummary);
  const projectStatusSummary = readObject(root.projectStatusSummary);
  const riskSummary = readObject(root.riskSummary);

  return {
    kpis: normalizeKpis(root.kpis),
    revenueSummary: {
      title: readString(
        revenueSummary ?? {},
        ["title"],
        analyticsPreviewData.revenueSummary.title,
      ),
      subtitle: readString(
        revenueSummary ?? {},
        ["subtitle"],
        analyticsPreviewData.revenueSummary.subtitle,
      ),
      points: normalizeRevenuePoints(revenueSummary?.points),
    },
    paymentTrendSummary: {
      title: readString(
        paymentTrendSummary ?? {},
        ["title"],
        analyticsPreviewData.paymentTrendSummary.title,
      ),
      subtitle: readString(
        paymentTrendSummary ?? {},
        ["subtitle"],
        analyticsPreviewData.paymentTrendSummary.subtitle,
      ),
      metrics: normalizeSummaryMetrics(paymentTrendSummary?.metrics),
    },
    projectStatusSummary: {
      title: readString(
        projectStatusSummary ?? {},
        ["title"],
        analyticsPreviewData.projectStatusSummary.title,
      ),
      subtitle: readString(
        projectStatusSummary ?? {},
        ["subtitle"],
        analyticsPreviewData.projectStatusSummary.subtitle,
      ),
      activeProjects: readNumber(
        projectStatusSummary ?? {},
        ["activeProjects", "active_projects"],
        analyticsPreviewData.projectStatusSummary.activeProjects,
      ),
      delayedProjects: readNumber(
        projectStatusSummary ?? {},
        ["delayedProjects", "delayed_projects"],
        analyticsPreviewData.projectStatusSummary.delayedProjects,
      ),
      completionRate: readString(
        projectStatusSummary ?? {},
        ["completionRate", "completion_rate"],
        analyticsPreviewData.projectStatusSummary.completionRate,
      ),
      notes: Array.isArray(projectStatusSummary?.notes)
        ? projectStatusSummary.notes.filter(
            (value): value is string =>
              typeof value === "string" && value.trim().length > 0,
          )
        : analyticsPreviewData.projectStatusSummary.notes,
    },
    riskSummary: {
      title: readString(
        riskSummary ?? {},
        ["title"],
        analyticsPreviewData.riskSummary.title,
      ),
      subtitle: readString(
        riskSummary ?? {},
        ["subtitle"],
        analyticsPreviewData.riskSummary.subtitle,
      ),
      totalAlerts: readNumber(
        riskSummary ?? {},
        ["totalAlerts", "total_alerts"],
        analyticsPreviewData.riskSummary.totalAlerts,
      ),
      items: normalizeRiskItems(riskSummary?.items),
    },
    exportAvailability: normalizeExportAvailability(root.exportAvailability),
  };
}

export function isAnalyticsUnavailableError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  return (
    error.code === "NETWORK_ERROR" ||
    error.statusCode === 404 ||
    error.statusCode === 405 ||
    error.statusCode === 501 ||
    error.statusCode === 503
  );
}

export function normalizeAnalyticsAiProjectOptions(
  payload: unknown,
): AnalyticsAiProjectOption[] {
  const records = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null
      ? ((payload as Record<string, unknown>).items ??
        (payload as Record<string, unknown>).projects ??
        (payload as Record<string, unknown>).results ??
        [])
      : [];

  if (!Array.isArray(records)) {
    return analyticsAiProjectPreviewOptions;
  }

  const projects = records
    .map((entry, index) => {
      const record = readObject(entry);

      if (!record) {
        return null;
      }

      return {
        id: readString(
          record,
          ["id", "projectId", "project_id"],
          `project-${index}`,
        ),
        name: readString(
          record,
          ["name", "projectName", "project_name", "title"],
          "Unnamed project",
        ),
        status: readString(record, ["status"], "Active"),
      } satisfies AnalyticsAiProjectOption;
    })
    .filter((item): item is AnalyticsAiProjectOption => item !== null);

  return projects.length > 0 ? projects : analyticsAiProjectPreviewOptions;
}

export function normalizeAnalyticsAiPredictionResult(
  payload: unknown,
): AnalyticsAiPredictionResult {
  const record = readObject(payload);

  if (!record) {
    return analyticsAiPredictionPreview;
  }

  const overallRiskValue = readString(
    record,
    [
      "overallRiskLevel",
      "overall_risk_level",
      "overallRisk",
      "riskLevel",
      "projectRiskLevel",
    ],
    analyticsAiPredictionPreview.overallRiskLevel,
  ).toLowerCase();

  return {
    overallRiskLevel:
      overallRiskValue === "high"
        ? "High"
        : overallRiskValue === "medium"
          ? "Medium"
          : "Low",
    milestoneDelayRisk: readString(
      record,
      ["milestoneDelayRisk", "milestone_delay_risk", "milestoneRisk"],
      analyticsAiPredictionPreview.milestoneDelayRisk,
    ),
    paymentDelayRisk: readString(
      record,
      ["paymentDelayRisk", "payment_delay_risk", "paymentRisk"],
      analyticsAiPredictionPreview.paymentDelayRisk,
    ),
    revenueTrend: readString(
      record,
      ["revenueTrend", "revenue_trend"],
      analyticsAiPredictionPreview.revenueTrend,
    ),
    explanation: readString(
      record,
      ["explanation", "summary", "plainLanguageExplanation"],
      analyticsAiPredictionPreview.explanation,
    ),
    recommendedAction: readString(
      record,
      ["recommendedAction", "recommended_action", "nextAction"],
      analyticsAiPredictionPreview.recommendedAction,
    ),
  };
}
