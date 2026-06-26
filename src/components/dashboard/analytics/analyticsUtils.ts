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
      { month: "Jan", value: 6.2, kind: "ACTUAL" },
      { month: "Feb", value: 7.6, kind: "ACTUAL" },
      { month: "Mar", value: 5.3, kind: "ACTUAL" },
      { month: "Apr", value: 10.1, kind: "ACTUAL" },
      { month: "May", value: 7, kind: "PROJECTED" },
      { month: "Jun", value: 7.5, kind: "PROJECTED" },
      { month: "Jul", value: 8, kind: "PROJECTED" },
      { month: "Aug", value: 6.5, kind: "PROJECTED" },
      { month: "Sep", value: 5.5, kind: "PROJECTED" },
      { month: "Oct", value: 8.5, kind: "PROJECTED" },
      { month: "Nov", value: 9, kind: "PROJECTED" },
      { month: "Dec", value: 10, kind: "PROJECTED" },
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

export function normalizeAnalyticsDashboardData(
  payload: unknown,
): AnalyticsDashboardData {
  const root = readObject(payload);

  if (!root) {
    return analyticsPreviewData;
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
    ["overallRiskLevel", "overall_risk_level", "overallRisk", "riskLevel"],
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
