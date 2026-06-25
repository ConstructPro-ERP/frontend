"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  Eye,
  FileOutput,
  Plus,
  RefreshCcw,
} from "lucide-react";
import apiClient from "@/lib/axios";
import type { FinanceInvoice, FinanceSummary } from "@/types/finance";
import {
  buildOutstandingBalances,
  filterInvoices,
  financeFilterTabs,
  financePreviewInvoices,
  financePreviewSummary,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  getFinanceStatusBadgeClasses,
  getFinanceStatusLabel,
  isFinanceUnavailableError,
  normalizeInvoices,
  normalizeSummary,
} from "@/components/dashboard/finance/financeUtils";

type FinanceState =
  | {
      kind: "loading";
    }
  | {
      kind: "ready";
      invoices: FinanceInvoice[];
      summary: FinanceSummary;
    }
  | {
      kind: "empty";
    }
  | {
      kind: "unavailable";
      invoices: FinanceInvoice[];
      summary: FinanceSummary;
      message: string;
    }
  | {
      kind: "error";
      message: string;
    };

async function loadFinanceData(): Promise<FinanceState> {
  try {
    const [invoiceResponse, summaryResponse] = await Promise.all([
      apiClient.get<unknown>("/finance/invoices"),
      apiClient.get<unknown>("/finance/summary"),
    ]);

    const invoices = normalizeInvoices(invoiceResponse.data);

    if (invoices.length === 0) {
      return { kind: "empty" };
    }

    return {
      kind: "ready",
      invoices,
      summary: normalizeSummary(summaryResponse.data, invoices),
    };
  } catch (error) {
    if (isFinanceUnavailableError(error)) {
      return {
        kind: "unavailable",
        invoices: financePreviewInvoices,
        summary: financePreviewSummary,
        message:
          "Finance APIs are not available yet. Showing prototype preview data until backend endpoints are connected.",
      };
    }

    return {
      kind: "error",
      message:
        error instanceof Error
          ? error.message
          : "Finance data could not be loaded right now.",
    };
  }
}

function FinanceSummaryCard({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const valueTone =
    tone === "warning"
      ? "text-risk-medium"
      : tone === "danger"
        ? "text-error"
        : "text-on-background";
  const subTone =
    tone === "success"
      ? "text-risk-low"
      : tone === "danger"
        ? "text-error"
        : tone === "warning"
          ? "text-error"
          : "text-on-surface-muted";

  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-[18px] shadow-level-1">
      <p className="mb-1.5 text-[11.5px] text-on-surface-muted">{label}</p>
      <p
        className={`font-mono text-[22px] font-bold tracking-[-0.04em] ${valueTone}`}
      >
        {value}
      </p>
      <p className={`mt-1.5 text-[11px] ${subTone}`}>{sublabel}</p>
    </article>
  );
}

function FinanceStatusBadge({ status }: { status: FinanceInvoice["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[11px] font-semibold ${getFinanceStatusBadgeClasses(status)}`}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-current" />
      {getFinanceStatusLabel(status)}
    </span>
  );
}

function FinanceStateCard({
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

function FinanceTable({ invoices }: { invoices: FinanceInvoice[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1040px] w-full border-collapse">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container">
            {[
              "Invoice #",
              "Project / Client",
              "Amount",
              "Paid",
              "Balance",
              "Status",
              "Due Date",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-muted"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const rowAccent =
              invoice.status === "OVERDUE" ? "bg-error-container/75" : "";

            return (
              <tr
                key={invoice.id}
                className={`border-b border-outline-variant transition hover:bg-surface-container ${rowAccent}`}
              >
                <td className="px-5 py-[13px] font-mono text-[12.5px] text-on-background">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-5 py-[13px]">
                  <div className="text-[13px] font-semibold text-on-background">
                    {invoice.projectName}
                  </div>
                  <div className="text-[12px] text-on-surface-muted">
                    {invoice.clientName}
                  </div>
                </td>
                <td className="px-5 py-[13px] font-mono text-[12.5px] text-on-background">
                  {formatCurrency(invoice.invoiceAmount)}
                </td>
                <td className="px-5 py-[13px] font-mono text-[12.5px] text-on-background">
                  {formatCurrency(invoice.paidAmount)}
                </td>
                <td
                  className={`px-5 py-[13px] font-mono text-[12.5px] font-semibold ${
                    invoice.status === "OVERDUE"
                      ? "text-error"
                      : invoice.outstandingBalance > 0
                        ? "text-risk-medium"
                        : "text-on-background"
                  }`}
                >
                  {formatCurrency(invoice.outstandingBalance)}
                </td>
                <td className="px-5 py-[13px]">
                  <FinanceStatusBadge status={invoice.status} />
                </td>
                <td
                  className={`px-5 py-[13px] text-[12px] ${
                    invoice.status === "OVERDUE"
                      ? "font-semibold text-error"
                      : "text-on-surface-muted"
                  }`}
                >
                  {invoice.previewDueNote || formatDate(invoice.dueDate)}
                </td>
                <td className="px-5 py-[13px]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-background transition hover:bg-surface-container-high"
                    >
                      <Eye size={13} />
                      View
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-background transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!invoice.pdfUrl}
                    >
                      <Download size={13} />
                      PDF
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FinanceWorkflowPlaceholder({
  panelRef,
}: {
  panelRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <section
      ref={panelRef}
      id="record-payment-panel"
      className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-1"
    >
      <div className="border-b border-outline-variant px-5 py-4">
        <h2 className="text-[14px] font-bold text-on-background">
          Record Payment
        </h2>
        <p className="mt-0.5 text-[11.5px] text-on-surface-muted">
          Update invoice payment status
        </p>
      </div>
      <div className="space-y-[14px] p-5">
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Invoice
          </label>
          <select
            disabled
            className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] text-[13px] text-on-background outline-none"
          >
            <option>INV-2026-021 — Sunset Residency</option>
            <option>INV-2026-020 — Blue Horizon</option>
            <option>INV-2026-018 — Emerald Tower</option>
            <option>INV-2026-017 — Lakshan Fernando</option>
          </select>
        </div>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Amount (LKR)
          </label>
          <input
            disabled
            type="number"
            readOnly
            value="2200000"
            className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] font-mono text-[13px] text-on-background outline-none"
          />
        </div>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Method
          </label>
          <select
            disabled
            className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] text-[13px] text-on-background outline-none"
          >
            <option>Bank Transfer</option>
            <option>Cheque</option>
            <option>Cash</option>
            <option>Online Transfer</option>
          </select>
        </div>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Date
          </label>
          <input
            disabled
            type="date"
            readOnly
            value="2026-04-12"
            className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] text-[13px] text-on-background outline-none"
          />
        </div>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Reference / Notes
          </label>
          <textarea
            disabled
            placeholder="Bank ref, cheque number, notes..."
            className="h-[70px] w-full resize-none rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] text-[13px] text-on-background outline-none placeholder:text-on-surface-muted"
          />
        </div>
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary-soft px-3 py-2 text-xs text-on-surface-variant">
          DDP-37 will activate this workflow and connect the submission
          behavior.
        </div>
      </div>
      <div className="flex gap-2 border-t border-outline-variant px-5 py-4">
        <button
          type="button"
          disabled
          className="flex-1 rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-muted opacity-70"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary opacity-70"
        >
          <Check size={14} />
          Record Payment
        </button>
      </div>
    </section>
  );
}

export default function FinanceDashboardClient() {
  const [financeState, setFinanceState] = useState<FinanceState>({
    kind: "loading",
  });
  const [activeFilter, setActiveFilter] =
    useState<(typeof financeFilterTabs)[number]["value"]>("ALL");
  const paymentPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;

    const hydrateFinancePage = async () => {
      setFinanceState({ kind: "loading" });
      const nextState = await loadFinanceData();

      if (active) {
        setFinanceState(nextState);
      }
    };

    hydrateFinancePage();

    return () => {
      active = false;
    };
  }, []);

  const retryLoad = async () => {
    setFinanceState({ kind: "loading" });
    setFinanceState(await loadFinanceData());
  };

  if (financeState.kind === "error") {
    return (
      <FinanceStateCard
        title="Finance dashboard unavailable"
        message={financeState.message}
        actionLabel="Try again"
        onAction={retryLoad}
      />
    );
  }

  const invoices =
    financeState.kind === "ready" || financeState.kind === "unavailable"
      ? financeState.invoices
      : [];
  const summary =
    financeState.kind === "ready" || financeState.kind === "unavailable"
      ? financeState.summary
      : {
          totalInvoiceValue: 0,
          totalPaidAmount: 0,
          outstandingBalance: 0,
          overdueAmount: 0,
        };

  const filteredInvoices = filterInvoices(invoices, activeFilter);
  const outstandingBalances = buildOutstandingBalances(invoices);

  return (
    <div className="space-y-5">
      {financeState.kind === "unavailable" ? (
        <div
          aria-live="polite"
          className="rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-on-surface-variant"
        >
          {financeState.message}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-4">
        <FinanceSummaryCard
          label="Total Invoiced"
          value={formatCompactCurrency(summary.totalInvoiceValue)}
          sublabel="↑ 18% vs last quarter"
          tone="success"
        />
        <FinanceSummaryCard
          label="Collected"
          value={formatCompactCurrency(summary.totalPaidAmount)}
          sublabel="87.6% collection rate"
          tone="success"
        />
        <FinanceSummaryCard
          label="Outstanding"
          value={formatCompactCurrency(summary.outstandingBalance)}
          sublabel="5 invoices overdue"
          tone="warning"
        />
        <FinanceSummaryCard
          label="Overdue Amount"
          value={formatCompactCurrency(summary.overdueAmount)}
          sublabel="Outstanding balance past due"
          tone="default"
        />
      </section>

      <section className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div
          className="inline-flex w-full flex-wrap overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest xl:w-auto"
          role="tablist"
          aria-label="Invoice status filters"
        >
          {financeFilterTabs.map((tab) => {
            const active = tab.value === activeFilter;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                className={`px-4 py-2 text-[12.5px] font-medium transition ${
                  active
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-background"
                }`}
                onClick={() => setActiveFilter(tab.value)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 xl:ml-auto">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-transparent px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-background"
          >
            <FileOutput size={14} />
            Export
          </button>
          <button
            type="button"
            onClick={() =>
              paymentPanelRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
          >
            <Plus size={14} />
            Record Payment
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-1">
          {financeState.kind === "loading" ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="h-14 animate-pulse rounded-lg bg-surface-container"
                />
              ))}
            </div>
          ) : financeState.kind === "empty" ? (
            <FinanceStateCard
              title="No invoices available"
              message="Invoice data was returned successfully, but there are no invoice records to display for the finance dashboard yet."
            />
          ) : filteredInvoices.length === 0 ? (
            <FinanceStateCard
              title="No invoices in this filter"
              message="Try another status tab to view invoices in a different payment state."
            />
          ) : (
            <FinanceTable invoices={filteredInvoices} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <FinanceWorkflowPlaceholder panelRef={paymentPanelRef} />

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-1">
            <div className="border-b border-outline-variant px-5 py-4">
              <h2 className="text-[13px] font-bold text-on-background">
                Outstanding Balances
              </h2>
              <p className="mt-1 text-[11.5px] text-on-surface-muted">
                Clients with pending amounts
              </p>
            </div>

            {financeState.kind === "loading" ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((row) => (
                  <div
                    key={row}
                    className="h-12 animate-pulse rounded-lg bg-surface-container"
                  />
                ))}
              </div>
            ) : outstandingBalances.length === 0 ? (
              <div className="p-5 text-sm text-on-surface-variant">
                No outstanding balances right now.
              </div>
            ) : (
              <div>
                {outstandingBalances.map((item) => {
                  const invoice = invoices.find(
                    (entry) => entry.id === item.id,
                  );
                  const dueCopy =
                    invoice?.previewDueNote ||
                    (item.status === "OVERDUE"
                      ? `${formatDate(item.dueDate)} overdue`
                      : `Due ${formatDate(item.dueDate)}`);

                  return (
                    <article
                      key={item.id}
                      className="flex items-center gap-3 border-b border-outline-variant px-5 py-3 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-on-background">
                          {item.clientName}
                        </p>
                        <p className="text-[11px] text-on-surface-muted">
                          {item.projectName} · {dueCopy}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 font-mono text-[13px] font-bold ${
                          item.status === "OVERDUE"
                            ? "text-error"
                            : "text-risk-medium"
                        }`}
                      >
                        {formatCompactCurrency(item.outstandingBalance)}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
