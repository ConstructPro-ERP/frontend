"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Check,
  Download,
  Eye,
  FileDigit,
  FileOutput,
  Plus,
  RefreshCcw,
} from "lucide-react";
import apiClient from "@/lib/axios";
import type {
  FinanceInvoice,
  FinancePaymentFormErrors,
  FinancePaymentFormValues,
  FinanceSummary,
} from "@/types/finance";
import {
  applyFinancePaymentToInvoice,
  buildOutstandingBalances,
  createFinancePaymentFormValues,
  defaultFinancePaymentMethod,
  findFinanceInvoiceById,
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
  validateFinancePaymentForm,
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

type FinanceFeedback = {
  tone: "success" | "error" | "info";
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

function FinanceFeedbackBanner({ feedback }: { feedback: FinanceFeedback }) {
  const toneClasses =
    feedback.tone === "success"
      ? "border-risk-low/20 bg-risk-low-container text-risk-low"
      : feedback.tone === "error"
        ? "border-error/20 bg-error-container text-on-error-container"
        : "border-primary/20 bg-primary-soft text-on-surface-variant";

  return (
    <div
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm ${toneClasses}`}
    >
      {feedback.message}
    </div>
  );
}

function FinanceTable({
  invoices,
  onRecordPayment,
  onViewDetails,
  onDownloadPdf,
  onExportInvoice,
}: {
  invoices: FinanceInvoice[];
  onRecordPayment: (invoice: FinanceInvoice) => void;
  onViewDetails: (invoice: FinanceInvoice) => void;
  onDownloadPdf: (invoice: FinanceInvoice) => void;
  onExportInvoice: (invoice: FinanceInvoice) => void;
}) {
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
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewDetails(invoice)}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-background transition hover:bg-surface-container-high"
                    >
                      <Eye size={13} />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onRecordPayment(invoice)}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-background transition hover:bg-surface-container-high"
                    >
                      <Check size={13} />
                      Record
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadPdf(invoice)}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-background transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Download size={13} />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportInvoice(invoice)}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-background transition hover:bg-surface-container-high"
                    >
                      <FileDigit size={13} />
                      Export
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

function FinancePaymentForm({
  panelRef,
  invoices,
  values,
  errors,
  isSubmitting,
  unavailableMessage,
  onChange,
  onCancel,
  onSubmit,
}: {
  panelRef: RefObject<HTMLElement | null>;
  invoices: FinanceInvoice[];
  values: FinancePaymentFormValues;
  errors: FinancePaymentFormErrors;
  isSubmitting: boolean;
  unavailableMessage?: string | null;
  onChange: (
    field: keyof FinancePaymentFormValues,
    value: string,
    invoiceChange?: boolean,
  ) => void;
  onCancel: () => void;
  onSubmit: () => void;
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
        {unavailableMessage ? (
          <div className="rounded-lg border border-primary/20 bg-primary-soft px-3 py-2 text-xs text-on-surface-variant">
            {unavailableMessage}
          </div>
        ) : null}
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Invoice
          </label>
          <select
            value={values.invoiceId}
            onChange={(event) =>
              onChange("invoiceId", event.target.value, true)
            }
            className={`w-full rounded-lg border px-3 py-[9px] text-[13px] text-on-background outline-none ${
              errors.invoiceId
                ? "border-error bg-error-container"
                : "border-outline-variant bg-surface-container"
            }`}
          >
            <option value="">Select invoice</option>
            {invoices
              .filter((invoice) => invoice.outstandingBalance > 0)
              .map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} — {invoice.projectName}
                </option>
              ))}
          </select>
          {errors.invoiceId ? (
            <p className="mt-1 text-xs text-error">{errors.invoiceId}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Amount (LKR)
          </label>
          <input
            type="number"
            value={values.paymentAmount}
            onChange={(event) => onChange("paymentAmount", event.target.value)}
            placeholder="0.00"
            className={`w-full rounded-lg border px-3 py-[9px] font-mono text-[13px] text-on-background outline-none ${
              errors.paymentAmount
                ? "border-error bg-error-container"
                : "border-outline-variant bg-surface-container"
            }`}
          />
          {errors.paymentAmount ? (
            <p className="mt-1 text-xs text-error">{errors.paymentAmount}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Method
          </label>
          <select
            value={values.paymentMethod}
            onChange={(event) => onChange("paymentMethod", event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] text-[13px] text-on-background outline-none"
          >
            {[
              defaultFinancePaymentMethod,
              "Cheque",
              "Cash",
              "Online Transfer",
            ].map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Date
          </label>
          <input
            type="date"
            value={values.paymentDate}
            onChange={(event) => onChange("paymentDate", event.target.value)}
            className={`w-full rounded-lg border px-3 py-[9px] text-[13px] text-on-background outline-none ${
              errors.paymentDate
                ? "border-error bg-error-container"
                : "border-outline-variant bg-surface-container"
            }`}
          />
          {errors.paymentDate ? (
            <p className="mt-1 text-xs text-error">{errors.paymentDate}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Reference
          </label>
          <input
            type="text"
            value={values.paymentReference}
            onChange={(event) =>
              onChange("paymentReference", event.target.value)
            }
            placeholder="Bank reference or cheque number"
            className={`w-full rounded-lg border px-3 py-[9px] text-[13px] text-on-background outline-none ${
              errors.paymentReference
                ? "border-error bg-error-container"
                : "border-outline-variant bg-surface-container"
            }`}
          />
          {errors.paymentReference ? (
            <p className="mt-1 text-xs text-error">{errors.paymentReference}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Reference / Notes
          </label>
          <textarea
            value={values.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            placeholder="Bank ref, cheque number, notes..."
            className="h-[70px] w-full resize-none rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] text-[13px] text-on-background outline-none placeholder:text-on-surface-muted"
          />
        </div>
      </div>
      <div className="flex gap-2 border-t border-outline-variant px-5 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-muted opacity-70"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <RefreshCcw size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          {isSubmitting ? "Recording..." : "Record Payment"}
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
  const [paymentFormValues, setPaymentFormValues] =
    useState<FinancePaymentFormValues>(createFinancePaymentFormValues());
  const [paymentFormErrors, setPaymentFormErrors] =
    useState<FinancePaymentFormErrors>({});
  const [feedback, setFeedback] = useState<FinanceFeedback | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentApiUnavailableMessage, setPaymentApiUnavailableMessage] =
    useState<string | null>(null);
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
  const selectedInvoice = findFinanceInvoiceById(
    invoices,
    paymentFormValues.invoiceId,
  );

  const focusPaymentPanel = () => {
    paymentPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handlePaymentFormChange = (
    field: keyof FinancePaymentFormValues,
    value: string,
    invoiceChange: boolean = false,
  ) => {
    if (invoiceChange) {
      const nextInvoice = findFinanceInvoiceById(invoices, value);
      setPaymentFormValues((currentValues) => ({
        ...currentValues,
        invoiceId: value,
        paymentAmount:
          nextInvoice && nextInvoice.outstandingBalance > 0
            ? String(nextInvoice.outstandingBalance)
            : currentValues.paymentAmount,
      }));
    } else {
      setPaymentFormValues((currentValues) => ({
        ...currentValues,
        [field]: value,
      }));
    }

    setPaymentFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setFeedback(null);
  };

  const handleSelectInvoiceForPayment = (invoice: FinanceInvoice) => {
    setPaymentFormValues(createFinancePaymentFormValues(invoice));
    setPaymentFormErrors({});
    setFeedback({
      tone: "info",
      message: `Record Payment opened for ${invoice.invoiceNumber}.`,
    });
    setPaymentApiUnavailableMessage(null);
    focusPaymentPanel();
  };

  const handleCancelPayment = () => {
    setPaymentFormValues(createFinancePaymentFormValues(selectedInvoice));
    setPaymentFormErrors({});
  };

  const handleViewInvoiceDetails = (invoice: FinanceInvoice) => {
    setFeedback({
      tone: "info",
      message: `Invoice details for ${invoice.invoiceNumber} are reserved for a future frontend scope.`,
    });
  };

  const handleDownloadPdf = (invoice: FinanceInvoice) => {
    if (!invoice.pdfUrl) {
      setFeedback({
        tone: "info",
        message: `Invoice PDF download is not available yet for ${invoice.invoiceNumber}.`,
      });
      return;
    }

    window.open(invoice.pdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleExportInvoice = (invoice: FinanceInvoice) => {
    setFeedback({
      tone: "info",
      message: `Invoice export for ${invoice.invoiceNumber} is a placeholder until backend support is connected.`,
    });
  };

  const handleSubmitPayment = async () => {
    const validationErrors = validateFinancePaymentForm(
      paymentFormValues,
      invoices,
    );

    if (Object.keys(validationErrors).length > 0) {
      setPaymentFormErrors(validationErrors);
      setFeedback({
        tone: "error",
        message: "Please correct the highlighted payment form errors.",
      });
      return;
    }

    const invoice = findFinanceInvoiceById(
      invoices,
      paymentFormValues.invoiceId,
    );

    if (!invoice) {
      setFeedback({
        tone: "error",
        message: "Selected invoice could not be found.",
      });
      return;
    }

    setIsSubmittingPayment(true);
    setFeedback(null);
    setPaymentApiUnavailableMessage(null);

    try {
      await apiClient.post("/finance/payments", {
        invoiceId: paymentFormValues.invoiceId,
        amount: Number(paymentFormValues.paymentAmount),
        paymentMethod: paymentFormValues.paymentMethod,
        paymentDate: paymentFormValues.paymentDate,
        reference: paymentFormValues.paymentReference,
        notes: paymentFormValues.notes || undefined,
      });

      const paymentAmount = Number(paymentFormValues.paymentAmount);
      const updatedInvoices = invoices.map((currentInvoice) =>
        currentInvoice.id === invoice.id
          ? applyFinancePaymentToInvoice(currentInvoice, paymentAmount)
          : currentInvoice,
      );
      const updatedSummary = normalizeSummary({}, updatedInvoices);

      if (financeState.kind === "unavailable") {
        setFinanceState({
          kind: "unavailable",
          invoices: updatedInvoices,
          summary: updatedSummary,
          message: financeState.message,
        });
      } else {
        setFinanceState({
          kind: "ready",
          invoices: updatedInvoices,
          summary: updatedSummary,
        });
      }
      setPaymentFormValues(createFinancePaymentFormValues());
      setPaymentFormErrors({});
      setFeedback({
        tone: "success",
        message: `Payment recorded successfully for ${invoice.invoiceNumber}.`,
      });
    } catch (error) {
      if (isFinanceUnavailableError(error)) {
        setPaymentApiUnavailableMessage(
          "Payment endpoint is not available yet. You can continue verifying the form and validation flow until backend support is connected.",
        );
        setFeedback({
          tone: "info",
          message:
            "Payment API is unavailable right now. Submission has been kept as a clear placeholder state.",
        });
      } else {
        setFeedback({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Payment could not be recorded right now.",
        });
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-5">
      {financeState.kind === "unavailable" ? (
        <FinanceFeedbackBanner
          feedback={{ tone: "info", message: financeState.message }}
        />
      ) : null}
      {feedback ? <FinanceFeedbackBanner feedback={feedback} /> : null}

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
          label="This Month"
          value="LKR 10.1M"
          sublabel="4 payments received"
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
            onClick={() =>
              setFeedback({
                tone: "info",
                message:
                  "Finance export is currently a placeholder until backend support is connected.",
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-transparent px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-background"
          >
            <FileOutput size={14} />
            Export
          </button>
          <button
            type="button"
            onClick={focusPaymentPanel}
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
            <FinanceTable
              invoices={filteredInvoices}
              onRecordPayment={handleSelectInvoiceForPayment}
              onViewDetails={handleViewInvoiceDetails}
              onDownloadPdf={handleDownloadPdf}
              onExportInvoice={handleExportInvoice}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <FinancePaymentForm
            panelRef={paymentPanelRef}
            invoices={invoices}
            values={paymentFormValues}
            errors={paymentFormErrors}
            isSubmitting={isSubmittingPayment}
            unavailableMessage={paymentApiUnavailableMessage}
            onChange={handlePaymentFormChange}
            onCancel={handleCancelPayment}
            onSubmit={handleSubmitPayment}
          />

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
