"use client";

import { useEffect, useState } from "react";
import { Download, Play, RefreshCcw, Radar } from "lucide-react";
import apiClient from "@/lib/axios";
import {
  analyticsPreviewData,
  formatAnalyticsCompactCurrency,
  isAnalyticsUnavailableError,
  normalizeAnalyticsDashboardData,
} from "@/components/dashboard/analytics/analyticsUtils";
import type {
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
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-lg border border-outline-variant bg-surface-container"
          />
        ))}
      </section>
      <div className="h-48 animate-pulse rounded-xl bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-950" />
      {[1, 2].map((item) => (
        <div
          key={item}
          className="h-64 animate-pulse rounded-xl border border-outline-variant bg-surface-container"
        />
      ))}
      <div className="grid gap-4 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-56 animate-pulse rounded-xl border border-outline-variant bg-surface-container"
          />
        ))}
      </div>
    </div>
  );
}

function AiPredictionBanner({
  isRunning,
  onRunAnalysis,
}: {
  isRunning: boolean;
  onRunAnalysis: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-950 px-6 py-5 text-on-hero shadow-level-2">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-indigo-400/25 text-indigo-200">
          <Radar size={24} strokeWidth={1.75} />
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
          disabled={isRunning}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-[18px] py-[10px] text-[13px] font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? (
            <RefreshCcw size={14} className="animate-spin" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
          {isRunning ? "Running Analysis..." : "Run Analysis"}
        </button>
      </div>
    </section>
  );
}

export default function AnalyticsDashboardClient() {
  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    kind: "loading",
  });
  const [feedback, setFeedback] = useState<AnalyticsFeedback | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrateAnalyticsPage = async () => {
      setAnalyticsState({ kind: "loading" });
      const nextState = await loadAnalyticsData();

      if (active) {
        setAnalyticsState(nextState);
      }
    };

    hydrateAnalyticsPage();

    return () => {
      active = false;
    };
  }, []);

  const retryLoad = async () => {
    setAnalyticsState({ kind: "loading" });
    setAnalyticsState(await loadAnalyticsData());
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

  const handleRunAnalysis = async () => {
    setFeedback(null);
    setIsRunningAnalysis(true);

    // DDP-40 keeps the approved analytics design and placeholder-safe UX
    // without introducing the out-of-scope DDP-39 result workflow.
    window.setTimeout(() => {
      setIsRunningAnalysis(false);
      setFeedback({
        tone: "info",
        message:
          "Run Analysis is shown as a placeholder until the AI prediction workflow is delivered. The current risk cards remain available for frontend verification.",
      });
    }, 450);
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

      <AiPredictionBanner
        isRunning={isRunningAnalysis}
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
