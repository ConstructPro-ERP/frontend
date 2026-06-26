export type AnalyticsKpiTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type AnalyticsRiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type AnalyticsKpiCard = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: AnalyticsKpiTone;
};

export type AnalyticsRevenuePoint = {
  month: string;
  value: number;
  kind: "ACTUAL" | "PROJECTED";
};

export type AnalyticsSummaryMetric = {
  id: string;
  name: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "neutral";
  points: number[];
};

export type AnalyticsRiskItem = {
  id: string;
  projectName: string;
  category: string;
  confidence: number;
  summary: string;
  factors: string[];
  level: AnalyticsRiskLevel;
};

export type AnalyticsExportAvailability =
  | "available"
  | "pending"
  | "unavailable";

export type AnalyticsDashboardData = {
  kpis: AnalyticsKpiCard[];
  revenueSummary: {
    title: string;
    subtitle: string;
    points: AnalyticsRevenuePoint[];
  };
  paymentTrendSummary: {
    title: string;
    subtitle: string;
    metrics: AnalyticsSummaryMetric[];
  };
  projectStatusSummary: {
    title: string;
    subtitle: string;
    activeProjects: number;
    delayedProjects: number;
    completionRate: string;
    notes: string[];
  };
  riskSummary: {
    title: string;
    subtitle: string;
    totalAlerts: number;
    items: AnalyticsRiskItem[];
  };
  exportAvailability: AnalyticsExportAvailability;
};

export type AnalyticsAiProjectOption = {
  id: string;
  name: string;
  status: string;
};

export type AnalyticsAiPredictionResult = {
  overallRiskLevel: "High" | "Medium" | "Low";
  milestoneDelayRisk: string;
  paymentDelayRisk: string;
  revenueTrend: string;
  explanation: string;
  recommendedAction: string;
};
