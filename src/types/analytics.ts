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
  projectProgress: AnalyticsProjectProgressItem[];
  riskSummary: {
    title: string;
    subtitle: string;
    totalAlerts: number;
    items: AnalyticsRiskItem[];
  };
  exportAvailability: AnalyticsExportAvailability;
};

export type AnalyticsFinanceTrendPoint = {
  label: string;
  totalRevenue: number;
  paidAmount: number;
  outstandingBalance: number;
};

export type AnalyticsProjectProgressItem = {
  projectId: string;
  projectName: string;
  status: string;
  milestoneCount: number;
  completedMilestoneCount: number;
  completionPercentage: number;
};

export type AnalyticsOverdueInvoiceItem = {
  invoiceId: string;
  invoiceNumber: string | null;
  outstandingAmount: number;
  customerName: string;
  projectId: string;
  projectName: string;
  daysOverdue: number;
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

export type AnalyticsAiPredictionSource =
  | "RULE_BASED"
  | "AI_PROVIDER"
  | "SAFE_FALLBACK";

export type AnalyticsAiRiskPredictionDto = {
  projectId: string;
  projectName: string;
  projectRiskLevel: AnalyticsRiskLevel;
  paymentDelayRisk: AnalyticsRiskLevel;
  milestoneDelayRisk: AnalyticsRiskLevel;
  revenueTrend: "DECLINING" | "STABLE" | "GROWING";
  explanation: string;
  recommendedAction: string;
  predictionSource: AnalyticsAiPredictionSource;
  sufficientData: boolean;
  confidenceScore: number;
  warnings: string[];
  generatedAt: string;
};
