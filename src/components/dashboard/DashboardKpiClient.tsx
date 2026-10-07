"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FolderKanban,
  RefreshCcw,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import { ApiError } from "@/lib/ApiError";
import {
  getDashboardSummary,
  isDashboardSummaryEmpty,
} from "@/services/dashboardApi";
import type { DashboardSummaryDto } from "@/types/dashboard";

type DashboardState =
  | { kind: "loading" }
  | { kind: "ready"; summary: DashboardSummaryDto }
  | { kind: "empty" }
  | { kind: "error"; message: string };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-LK").format(value);
}

function getDashboardErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.statusCode === 403) {
      return "Your role does not have permission to view management KPIs.";
    }
    if (error.statusCode === 401) {
      return "Your session has expired. Please sign in again.";
    }
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : "Dashboard KPIs could not be loaded right now.";
}

function KpiCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-[24px] border border-outline-variant bg-surface-container-lowest p-5 shadow-level-1">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-on-surface-variant">{label}</p>
          <p className="mt-3 truncate text-3xl font-bold tracking-tight text-on-background">
            {value}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-primary-soft p-3 text-primary">
          {icon}
        </div>
      </div>
      <p className="mt-5 text-sm text-on-surface-muted">{note}</p>
    </article>
  );
}

function DashboardStateCard({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-dashed border-outline bg-surface-container-lowest p-8 text-center shadow-level-1">
      <h2 className="text-lg font-semibold text-on-background">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
        >
          <RefreshCcw size={14} />
          Try again
        </button>
      ) : null}
    </section>
  );
}

export default function DashboardKpiClient() {
  const [state, setState] = useState<DashboardState>({ kind: "loading" });

  const loadSummary = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const summary = await getDashboardSummary();
      setState(
        isDashboardSummaryEmpty(summary)
          ? { kind: "empty" }
          : { kind: "ready", summary },
      );
    } catch (error) {
      setState({ kind: "error", message: getDashboardErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    let active = true;

    void getDashboardSummary()
      .then((summary) => {
        if (!active) return;
        setState(
          isDashboardSummaryEmpty(summary)
            ? { kind: "empty" }
            : { kind: "ready", summary },
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            kind: "error",
            message: getDashboardErrorMessage(error),
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div aria-label="Loading dashboard KPIs" className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-[24px] border border-outline-variant bg-surface-container"
            />
          ))}
        </section>
      </div>
    );
  }

  if (state.kind === "empty") {
    return (
      <DashboardStateCard
        title="No KPI data available"
        message="The analytics service returned valid zero values. Business KPIs will appear here as invoices, projects, leads, and quotations are created."
      />
    );
  }

  if (state.kind === "error") {
    return (
      <DashboardStateCard
        title="Dashboard KPIs unavailable"
        message={state.message}
        onRetry={() => void loadSummary()}
      />
    );
  }

  const { revenue, projects, invoices, sales } = state.summary;

  return (
    <div className="space-y-7">
      <section aria-labelledby="finance-kpis">
        <h2
          id="finance-kpis"
          className="mb-3 text-lg font-semibold text-on-background"
        >
          Finance overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Revenue"
            value={formatCurrency(revenue.totalRevenue)}
            note="Total invoiced value"
            icon={<CircleDollarSign size={20} />}
          />
          <KpiCard
            label="Paid Amount"
            value={formatCurrency(revenue.paidAmount)}
            note={`${invoices.paidCount} fully paid invoices`}
            icon={<Banknote size={20} />}
          />
          <KpiCard
            label="Outstanding"
            value={formatCurrency(revenue.outstandingBalance)}
            note={`${invoices.overdueCount} overdue invoices`}
            icon={<WalletCards size={20} />}
          />
          <KpiCard
            label="Total Invoices"
            value={formatCount(invoices.totalInvoices)}
            note={`${invoices.partiallyPaidCount} partially paid`}
            icon={<FileCheck2 size={20} />}
          />
        </div>
      </section>

      <section aria-labelledby="project-kpis">
        <h2
          id="project-kpis"
          className="mb-3 text-lg font-semibold text-on-background"
        >
          Project overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Projects"
            value={formatCount(projects.totalProjects)}
            note={`${projects.completedProjectCount} completed`}
            icon={<BriefcaseBusiness size={20} />}
          />
          <KpiCard
            label="Active Projects"
            value={formatCount(projects.activeProjectCount)}
            note={`${projects.overdueProjectCount} overdue`}
            icon={<FolderKanban size={20} />}
          />
          <KpiCard
            label="Completion Rate"
            value={`${projects.completionRate.toFixed(1)}%`}
            note="Completed projects as a share of total"
            icon={<CheckCircle2 size={20} />}
          />
          <KpiCard
            label="Overdue Projects"
            value={formatCount(projects.overdueProjectCount)}
            note="Active projects past their end date"
            icon={<Target size={20} />}
          />
        </div>
      </section>

      <section aria-labelledby="sales-kpis">
        <h2
          id="sales-kpis"
          className="mb-3 text-lg font-semibold text-on-background"
        >
          Sales overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Leads"
            value={formatCount(sales.totalLeads)}
            note={`${sales.convertedLeads} converted leads`}
            icon={<Users size={20} />}
          />
          <KpiCard
            label="Lead Conversion"
            value={`${sales.leadConversionRate.toFixed(1)}%`}
            note="Converted leads as a share of total"
            icon={<Target size={20} />}
          />
          <KpiCard
            label="Total Quotations"
            value={formatCount(sales.totalQuotations)}
            note={`${sales.quotationApprovalCount} approved or converted`}
            icon={<FileCheck2 size={20} />}
          />
          <KpiCard
            label="Converted Quotations"
            value={formatCount(sales.convertedQuotationCount)}
            note={`${sales.rejectedQuotationCount} rejected`}
            icon={<CheckCircle2 size={20} />}
          />
        </div>
      </section>
    </div>
  );
}
