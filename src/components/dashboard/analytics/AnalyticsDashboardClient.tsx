"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { BrainCircuit, Download, RefreshCcw } from "lucide-react";
import apiClient from "@/lib/axios";
import {
  analyticsAiPredictionPreview,
  analyticsAiProjectPreviewOptions,
  analyticsPreviewData,
  formatAnalyticsCompactCurrency,
  isAnalyticsUnavailableError,
  normalizeAnalyticsAiPredictionResult,
  normalizeAnalyticsAiProjectOptions,
  normalizeAnalyticsDashboardData,
} from "@/components/dashboard/analytics/analyticsUtils";
import type { RootState } from "@/store";
import type {
  AnalyticsAiPredictionResult,
  AnalyticsAiProjectOption,
  AnalyticsDashboardData,
  AnalyticsKpiCard,
  AnalyticsRiskItem,
  AnalyticsSummaryMetric,
} from "@/types/analytics";

type AnalyticsState =
  | { kind: "loading" }
  | { kind: "ready"; data: AnalyticsDashboardData }
  | { kind: "empty" }
  | { kind: "unavailable"; data: AnalyticsDashboardData; message: string }
  | { kind: "error"; message: string };

type AnalyticsFeedback = {
  tone: "info" | "error";
  message: string;
};

type AnalyticsPredictionState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: AnalyticsAiPredictionResult }
  | { kind: "insufficient-data"; message: string }
  | { kind: "error"; message: string };

const analyticsOverviewCards: AnalyticsKpiCard[] = [
  {
    id: "ytd-revenue",
    value: "LKR 48.2M",
    label: "YTD Revenue",
    note: "↑ 12.4% vs last year",
    tone: "success",
  },
  {
    id: "avg-project-completion",
    value: "68%",
    label: "Avg Project Completion",
    note: "14 active projects",
    tone: "info",
  },
  {
    id: "payment-collection-rate",
    value: "87.6%",
    label: "Payment Collection Rate",
    note: "5 invoices overdue",
    tone: "warning",
  },
  {
    id: "ai-risk-alerts",
    value: "3",
    label: "AI Risk Alerts",
    note: "Requires attention",
    tone: "danger",
  },
];

async function loadAnalyticsData(): Promise<AnalyticsState> {
  try {
    const response = await apiClient.get<unknown>("/analytics/dashboard");
    const data = normalizeAnalyticsDashboardData(response.data);

    if (data.kpis.length === 0) {
      return { kind: "empty" };
    }

    return { kind: "ready", data };
  } catch (error) {
    if (isAnalyticsUnavailableError(error)) {
      return {
        kind: "unavailable",
        data: analyticsPreviewData,
        message:
          "Analytics APIs are not available yet. Showing approved placeholder insights until backend endpoints are connected.",
      };
    }

    return {
      kind: "error",
      message:
        error instanceof Error
          ? error.message
          : "Analytics data could not be loaded right now.",
    };
  }
}

async function loadAiProjectOptions() {
  try {
    const response = await apiClient.get<unknown>("/analytics/projects");
    return normalizeAnalyticsAiProjectOptions(response.data);
  } catch (error) {
    if (isAnalyticsUnavailableError(error)) {
      return analyticsAiProjectPreviewOptions;
    }

    return [];
  }
}

function AnalyticsStateCard({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-outline bg-surface-container-lowest p-8 text-center shadow-level-1">
      <h2 className="text-lg font-semibold text-on-background">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
        {message}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
        >
          <RefreshCcw size={14} />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function FeedbackBanner({ feedback }: { feedback: AnalyticsFeedback }) {
  const classes =
    feedback.tone === "error"
      ? "border-error/20 bg-error-container text-on-error-container"
      : "border-primary/20 bg-primary-soft text-on-surface-variant";

  return (
    <div
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm ${classes}`}
    >
      {feedback.message}
    </div>
  );
}

function KpiCard({ card }: { card: AnalyticsKpiCard }) {
  const toneClass =
    card.tone === "success"
      ? "text-risk-low"
      : card.tone === "info"
        ? "text-primary"
        : card.tone === "warning"
          ? "text-risk-medium"
          : card.tone === "danger"
            ? "text-error"
            : "text-on-background";

  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container-lowest px-[18px] py-[14px] shadow-level-1">
      <p className="font-mono text-[22px] font-bold tracking-[-0.04em] text-on-background">
        {card.value}
      </p>
      <p className="mt-[3px] text-[11.5px] text-on-surface-muted">
        {card.label}
      </p>
      <p className={`mt-[6px] text-[10.5px] font-semibold ${toneClass}`}>
        {card.note}
      </p>
    </article>
  );
}

function AnalyticsCardShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
        <div>
          <h2 className="text-[14px] font-bold text-on-background">{title}</h2>
          <p className="mt-0.5 text-[11.5px] text-on-surface-muted">
            {subtitle}
          </p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function RevenueSummary({
  data,
  onExport,
}: {
  data: AnalyticsDashboardData["revenueSummary"];
  onExport: () => void;
}) {
  const maxValue = Math.max(...data.points.map((point) => point.value), 1);

  return (
    <AnalyticsCardShell
      title={data.title}
      subtitle={data.subtitle}
      action={
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-transparent px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-background"
        >
          <Download size={13} />
          Export
        </button>
      }
    >
      <div className="p-5">
        <div className="flex h-40 items-end gap-[6px]">
          {data.points.map((point) => {
            const height = `${Math.max((point.value / maxValue) * 100, 12)}%`;
            const barClass =
              point.kind === "ACTUAL"
                ? "bg-primary"
                : "bg-slate-300 opacity-50";

            return (
              <div
                key={point.month}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex h-full w-full items-end">
                  <div
                    role="img"
                    aria-label={`${point.month} revenue ${formatAnalyticsCompactCurrency(point.value * 1_000_000)}`}
                    className={`w-full rounded-t-[4px] ${barClass}`}
                    style={{ height }}
                  />
                </div>
                <span className="font-mono text-[10px] text-on-surface-muted">
                  {point.month}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-[11.5px] text-on-surface-variant">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Actual
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            Projected (AI)
          </span>
        </div>
      </div>
    </AnalyticsCardShell>
  );
}

function Sparkline({
  points,
  strokeClass,
}: {
  points: number[];
  strokeClass: string;
}) {
  if (points.length === 0) {
    return null;
  }

  const width = 200;
  const height = 32;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / Math.max(points.length - 1, 1);
  const line = points
    .map((point, index) => {
      const x = step * index;
      const y = height - ((point - min) / range) * (height - 4) - 2;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width="100%"
      height="32"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        className={strokeClass}
      />
    </svg>
  );
}

function PaymentTrendSummary({
  metrics,
}: {
  metrics: AnalyticsSummaryMetric[];
}) {
  return (
    <AnalyticsCardShell
      title="Performance Metrics"
      subtitle="Key indicators vs targets"
    >
      <div className="px-5 py-4">
        {metrics.map((metric) => {
          const trendColor =
            metric.trend === "up"
              ? "text-risk-low"
              : metric.trend === "down"
                ? "text-error"
                : "text-on-surface-variant";
          const lineColor =
            metric.name === "Lead Conversion"
              ? "text-primary"
              : metric.name === "Avg Project Duration"
                ? "text-risk-medium"
                : metric.name === "Payment on Time"
                  ? "text-risk-low"
                  : metric.name === "Cost Overruns"
                    ? "text-error"
                    : "text-risk-low";

          return (
            <div
              key={metric.id}
              className="flex items-center gap-3 border-b border-outline-variant py-[10px] last:border-b-0"
            >
              <div className="w-[140px] shrink-0">
                <p className="text-[12.5px] font-semibold text-on-background">
                  {metric.name}
                </p>
                <p className="font-mono text-[11px] text-on-surface-muted">
                  {metric.value}
                </p>
              </div>
              <div className="flex-1">
                <Sparkline points={metric.points} strokeClass={lineColor} />
              </div>
              <div
                className={`w-[60px] shrink-0 text-right font-mono text-[12px] font-bold ${trendColor}`}
              >
                {metric.delta}
              </div>
            </div>
          );
        })}
      </div>
    </AnalyticsCardShell>
  );
}

function RiskBadge({ level }: { level: AnalyticsRiskItem["level"] }) {
  const classes =
    level === "HIGH"
      ? "bg-error-container text-error"
      : level === "MEDIUM"
        ? "bg-risk-medium-container text-risk-medium"
        : "bg-risk-low-container text-risk-low";
  const label =
    level === "HIGH"
      ? "High Risk"
      : level === "MEDIUM"
        ? "Med Risk"
        : "Low Risk";

  return (
    <span
      className={`inline-flex items-center rounded-full px-[9px] py-[3px] text-[11px] font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function RiskSummary({
  data,
}: {
  data: AnalyticsDashboardData["riskSummary"];
}) {
  return (
    <section>
      <div className="mb-[14px] flex items-center gap-2 text-[13px] font-bold text-on-background">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-error-container text-[10px] text-error">
          !
        </span>
        {data.title}
        <span className="ml-1 text-[11px] font-normal text-on-surface-muted">
          {data.subtitle}
        </span>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {data.items.map((item) => {
          const meterClass =
            item.level === "HIGH"
              ? "bg-error"
              : item.level === "MEDIUM"
                ? "bg-risk-medium"
                : "bg-risk-low";
          const confidenceClass =
            item.level === "HIGH"
              ? "text-error"
              : item.level === "MEDIUM"
                ? "text-risk-medium"
                : "text-risk-low";
          const borderClass =
            item.level === "HIGH"
              ? "border-l-4 border-l-error"
              : item.level === "MEDIUM"
                ? "border-l-4 border-l-risk-medium"
                : "border-l-4 border-l-risk-low";

          return (
            <article
              key={item.id}
              className={`flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-[18px] shadow-level-1 ${borderClass}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[13.5px] font-bold text-on-background">
                    {item.projectName}
                  </h3>
                  <p className="mt-0.5 text-[11.5px] text-on-surface-muted">
                    {item.category}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-mono text-[20px] font-extrabold ${confidenceClass}`}
                  >
                    {item.confidence}%
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.05em] text-on-surface-muted">
                    Confidence
                  </p>
                </div>
              </div>
              <div className="mt-1 h-[5px] overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className={`h-full rounded-full ${meterClass}`}
                  style={{
                    width: `${Math.min(Math.max(item.confidence, 0), 100)}%`,
                  }}
                />
              </div>
              <div className="rounded-md border-l-[3px] border-l-outline bg-surface-container px-3 py-2.5 text-[12.5px] leading-6 text-on-surface-variant">
                {item.summary}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {item.factors.map((factor) => (
                    <span
                      key={factor}
                      className="rounded-full bg-surface px-2 py-1 text-[10.5px] text-on-surface-variant"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
                <RiskBadge level={item.level} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function LoadingView() {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-lg border border-outline-variant bg-surface-container"
          />
        ))}
      </section>
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-64 animate-pulse rounded-xl border border-outline-variant bg-surface-container"
        />
      ))}
    </div>
  );
}

function AiPredictionPanel({
  canRunAnalysis,
  projects,
  selectedProjectId,
  predictionState,
  isUnavailableMode,
  onProjectChange,
  onRunAnalysis,
}: {
  canRunAnalysis: boolean;
  projects: AnalyticsAiProjectOption[];
  selectedProjectId: string;
  predictionState: AnalyticsPredictionState;
  isUnavailableMode: boolean;
  onProjectChange: (value: string) => void;
  onRunAnalysis: () => void;
}) {
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;
  const disabled = !canRunAnalysis || predictionState.kind === "loading";

  return (
    <section className="overflow-hidden rounded-xl bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-950 px-6 py-5 text-on-hero shadow-level-2">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-indigo-400/25 text-indigo-200">
          <BrainCircuit size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-extrabold tracking-[-0.3px] text-white">
            AI Risk Prediction Engine
          </h2>
          <p className="mt-1 max-w-3xl text-[12.5px] text-blue-100/60">
            Retrieval-Augmented Generation · Analysing historical project data,
            payment patterns, and milestone velocity to predict risks and delays
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-[11.5px] text-blue-100/55">
            <span>
              Last run:{" "}
              <strong className="font-semibold text-white/85">
                2 hours ago
              </strong>
            </span>
            <span>
              Data points analysed:{" "}
              <strong className="font-semibold text-white/85">1,247</strong>
            </span>
            <span>
              Model:{" "}
              <strong className="font-semibold text-white/85">
                LangChain RAG v2.1
              </strong>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={disabled || !selectedProjectId}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-[18px] py-[10px] text-[13px] font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {predictionState.kind === "loading" ? (
            <RefreshCcw size={14} className="animate-spin" />
          ) : (
            <BrainCircuit size={14} />
          )}
          {predictionState.kind === "loading"
            ? "Running Analysis..."
            : "Run Analysis"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-white/90">
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/65">
              Project for analysis
            </span>
            <select
              value={selectedProjectId}
              onChange={(event) => onProjectChange(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none"
              disabled={!canRunAnalysis || projects.length === 0}
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                    className="text-slate-900"
                  >
                    {project.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <p className="mt-3 text-[11.5px] leading-5 text-white/65">
            {canRunAnalysis
              ? selectedProject
                ? `Selected project: ${selectedProject.name}`
                : "Select a project to begin."
              : "AI analysis is only available to management users with permission to review risk predictions."}
          </p>
          <p className="mt-2 text-[11.5px] leading-5 text-white/55">
            {isUnavailableMode
              ? "Backend pending, preview and placeholder handling enabled."
              : "Live API request enabled when backend is available."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 text-on-background shadow-level-1">
          {predictionState.kind === "idle" ? (
            <div>
              <h3 className="text-[14px] font-bold text-on-background">
                Prediction results
              </h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Select a project and run analysis to view overall project risk
                level, milestone delay risk, payment delay risk, revenue trend,
                a plain-language explanation, and a recommended action.
              </p>
            </div>
          ) : null}

          {predictionState.kind === "loading" ? (
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold text-on-background">
                Prediction results
              </h3>
              <p className="text-sm text-on-surface-variant">
                AI analysis is processing. Duplicate submissions are disabled
                until this request completes.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-xl bg-surface-container"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {predictionState.kind === "insufficient-data" ? (
            <div>
              <h3 className="text-[14px] font-bold text-on-background">
                Insufficient data
              </h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {predictionState.message}
              </p>
            </div>
          ) : null}

          {predictionState.kind === "error" ? (
            <div>
              <h3 className="text-[14px] font-bold text-on-background">
                Analysis error
              </h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {predictionState.message}
              </p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Retry the request when the backend AI prediction API is
                available.
              </p>
            </div>
          ) : null}

          {predictionState.kind === "success" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[14px] font-bold text-on-background">
                    Prediction results
                  </h3>
                  <p className="mt-1 text-[11.5px] text-on-surface-muted">
                    Summary for {selectedProject?.name ?? "selected project"}
                  </p>
                </div>
                <RiskBadge
                  level={
                    predictionState.result.overallRiskLevel === "High"
                      ? "HIGH"
                      : predictionState.result.overallRiskLevel === "Medium"
                        ? "MEDIUM"
                        : "LOW"
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                  <p className="text-[11px] text-on-surface-muted">
                    Overall project risk level
                  </p>
                  <p className="mt-2 text-sm font-semibold text-on-background">
                    {predictionState.result.overallRiskLevel}
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                  <p className="text-[11px] text-on-surface-muted">
                    Milestone delay risk
                  </p>
                  <p className="mt-2 text-sm font-semibold text-on-background">
                    {predictionState.result.milestoneDelayRisk}
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                  <p className="text-[11px] text-on-surface-muted">
                    Payment delay risk
                  </p>
                  <p className="mt-2 text-sm font-semibold text-on-background">
                    {predictionState.result.paymentDelayRisk}
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                  <p className="text-[11px] text-on-surface-muted">
                    Revenue trend
                  </p>
                  <p className="mt-2 text-sm font-semibold text-on-background">
                    {predictionState.result.revenueTrend}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                <div className="rounded-xl border border-outline-variant bg-surface-container px-4 py-4">
                  <p className="text-[11px] text-on-surface-muted">
                    Plain-language explanation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {predictionState.result.explanation}
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface-container px-4 py-4">
                  <p className="text-[11px] text-on-surface-muted">
                    Recommended action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {predictionState.result.recommendedAction}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function AnalyticsDashboardClient() {
  const userRole = useSelector(
    (state: RootState) => state.auth.user?.role ?? null,
  );
  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    kind: "loading",
  });
  const [feedback, setFeedback] = useState<AnalyticsFeedback | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [analysisProjects, setAnalysisProjects] = useState<
    AnalyticsAiProjectOption[]
  >(analyticsAiProjectPreviewOptions);
  const [selectedProjectId, setSelectedProjectId] = useState(
    analyticsAiProjectPreviewOptions[0]?.id ?? "",
  );
  const [predictionState, setPredictionState] =
    useState<AnalyticsPredictionState>({
      kind: "idle",
    });

  useEffect(() => {
    let active = true;

    const hydrateAnalyticsPage = async () => {
      setAnalyticsState({ kind: "loading" });
      const [nextState, nextProjects] = await Promise.all([
        loadAnalyticsData(),
        loadAiProjectOptions(),
      ]);

      if (active) {
        setAnalyticsState(nextState);
        if (nextProjects.length > 0) {
          setAnalysisProjects(nextProjects);
          setSelectedProjectId(
            (currentValue) => currentValue || nextProjects[0].id,
          );
        }
      }
    };

    hydrateAnalyticsPage();

    return () => {
      active = false;
    };
  }, []);

  const retryLoad = async () => {
    setAnalyticsState({ kind: "loading" });
    const [nextState, nextProjects] = await Promise.all([
      loadAnalyticsData(),
      loadAiProjectOptions(),
    ]);
    setAnalyticsState(nextState);
    if (nextProjects.length > 0) {
      setAnalysisProjects(nextProjects);
      setSelectedProjectId(
        (currentValue) => currentValue || nextProjects[0].id,
      );
    }
  };

  const data =
    analyticsState.kind === "ready" || analyticsState.kind === "unavailable"
      ? analyticsState.data
      : null;

  const handleExport = async () => {
    if (!data) {
      return;
    }

    setFeedback(null);

    if (data.exportAvailability !== "available") {
      setFeedback({
        tone: "info",
        message:
          "Analytics export is shown as a placeholder until the backend export endpoint is connected.",
      });
      return;
    }

    setIsExporting(true);

    try {
      await apiClient.get<unknown>("/analytics/export");
      setFeedback({
        tone: "info",
        message: "Analytics export request submitted successfully.",
      });
    } catch (error) {
      if (isAnalyticsUnavailableError(error)) {
        setFeedback({
          tone: "info",
          message:
            "Analytics export endpoint is not available yet. Placeholder state is being shown instead.",
        });
      } else {
        setFeedback({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Analytics export could not be started right now.",
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const canRunAnalysis = userRole === "ADMIN" || userRole === "MANAGER";

  const handleRunAnalysis = async () => {
    if (
      !canRunAnalysis ||
      !selectedProjectId ||
      predictionState.kind === "loading"
    ) {
      return;
    }

    setFeedback(null);
    setPredictionState({ kind: "loading" });

    try {
      const response = await apiClient.post<unknown>("/analytics/predictions", {
        projectId: selectedProjectId,
      });
      const resultPayload =
        typeof response.data === "object" &&
        response.data !== null &&
        "result" in (response.data as Record<string, unknown>)
          ? (response.data as Record<string, unknown>).result
          : response.data;
      const statusValue =
        typeof response.data === "object" &&
        response.data !== null &&
        "status" in (response.data as Record<string, unknown>)
          ? String(
              (response.data as Record<string, unknown>).status,
            ).toLowerCase()
          : "success";

      if (
        statusValue === "insufficient-data" ||
        statusValue === "insufficient_data"
      ) {
        setPredictionState({
          kind: "insufficient-data",
          message:
            "Additional project history is required before reliable predictions can be generated for this project.",
        });
        return;
      }

      setPredictionState({
        kind: "success",
        result: normalizeAnalyticsAiPredictionResult(resultPayload),
      });
    } catch (error) {
      if (isAnalyticsUnavailableError(error)) {
        setPredictionState({
          kind: "success",
          result: analyticsAiPredictionPreview,
        });
        setFeedback({
          tone: "info",
          message:
            "AI prediction API is not available yet. Showing approved placeholder analysis results for frontend verification.",
        });
      } else {
        setPredictionState({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "AI analysis could not be completed right now.",
        });
      }
    }
  };

  if (analyticsState.kind === "error") {
    return (
      <AnalyticsStateCard
        title="Analytics dashboard unavailable"
        message={analyticsState.message}
        actionLabel="Try again"
        onAction={retryLoad}
      />
    );
  }

  if (analyticsState.kind === "loading") {
    return <LoadingView />;
  }

  if (analyticsState.kind === "empty") {
    return (
      <AnalyticsStateCard
        title="No analytics data available"
        message="Analytics data returned successfully, but there are no KPI or summary records to display yet."
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-5">
      {analyticsState.kind === "unavailable" ? (
        <FeedbackBanner
          feedback={{ tone: "info", message: analyticsState.message }}
        />
      ) : null}
      {feedback ? <FeedbackBanner feedback={feedback} /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analyticsOverviewCards.map((card) => (
          <KpiCard key={card.id} card={card} />
        ))}
      </section>

      <AiPredictionPanel
        canRunAnalysis={canRunAnalysis}
        projects={analysisProjects}
        selectedProjectId={selectedProjectId}
        predictionState={predictionState}
        isUnavailableMode={analyticsState.kind === "unavailable"}
        onProjectChange={setSelectedProjectId}
        onRunAnalysis={handleRunAnalysis}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        <RevenueSummary data={data.revenueSummary} onExport={handleExport} />
        <PaymentTrendSummary metrics={data.paymentTrendSummary.metrics} />
      </section>

      <RiskSummary data={data.riskSummary} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-transparent px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? (
            <RefreshCcw size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {isExporting ? "Exporting..." : "Export Analytics"}
        </button>
      </div>
    </div>
  );
}
