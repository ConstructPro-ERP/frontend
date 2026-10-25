"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import { Check, Download, Eye, Plus, RefreshCcw } from "lucide-react";
import {
  getFinanceErrorMessage,
  getFinanceInvoice,
  generateFinanceInvoicePdf,
  listFinanceInvoices,
  recordFinancePayment,
} from "@/services/financeApi";
import type {
  FinanceInvoice,
  FinancePaymentFormErrors,
  FinancePaymentFormValues,
  FinanceSummary,
} from "@/types/finance";
import {
  canCreateFinanceInvoice,
  buildOutstandingBalances,
  createFinancePaymentFormValues,
  defaultFinancePaymentMethod,
  findFinanceInvoiceById,
  filterInvoices,
  financeFilterTabs,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  getFinanceStatusBadgeClasses,
  getFinanceStatusLabel,
  isFinanceUnavailableError,
  normalizeSummary,
  validateFinancePaymentForm,
} from "@/components/dashboard/finance/financeUtils";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";
import { getDashboardSummary } from "@/services/dashboardApi";
import type { User } from "@/types/auth";
import CreateInvoiceForm from "./CreateInvoiceForm";

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
      kind: "error";
      message: string;
    };

type FinanceFeedback = {
  tone: "success" | "error" | "info";
  message: string;
};

function normalizeFinanceSummaryFromAnalytics(
  payload: unknown,
  invoices: FinanceInvoice[],
): FinanceSummary {
  if (typeof payload !== "object" || payload === null) {
    return normalizeSummary({}, invoices);
  }

  const root = payload as Record<string, unknown>;
  const revenue =
    typeof root.revenue === "object" && root.revenue !== null
      ? (root.revenue as Record<string, unknown>)
      : null;

  if (!revenue) {
    return normalizeSummary(payload, invoices);
  }

  return normalizeSummary(
    {
      totalInvoiceValue: revenue.totalRevenue,
      totalPaidAmount: revenue.paidAmount,
      outstandingBalance: revenue.outstandingBalance,
      overdueAmount: invoices
        .filter((invoice) => invoice.status === "OVERDUE")
        .reduce((total, invoice) => total + invoice.outstandingBalance, 0),
    },
    invoices,
  );
}

async function loadFinanceData(
  user: User | null,
): Promise<Extract<FinanceState, { kind: "ready" | "empty" }>> {
  if (!user) {
    throw new Error("Authentication is required to load finance data.");
  }

  const summaryKey = JSON.stringify([user.id, user.role, "home:summary"]);

  // Share the dashboard summary request with the header.
  const [invoices, analyticsSummary] = await Promise.all([
    listFinanceInvoices(),
    dashboardQueryCache
      .fetch(summaryKey, getDashboardSummary)
      .catch(() => null),
  ]);

  const summary = analyticsSummary
    ? normalizeFinanceSummaryFromAnalytics(analyticsSummary, invoices)
    : normalizeSummary({}, invoices);

  if (invoices.length === 0 && summary.outstandingBalance === 0) {
    return { kind: "empty" };
  }

  return {
    kind: "ready",
    invoices,
    summary,
  };
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
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-4.5 shadow-level-1">
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
      className={`inline-flex items-center gap-1 rounded-full px-2.25 py-0.75 text-[11px] font-semibold ${getFinanceStatusBadgeClasses(status)}`}
    >
      <span className="h-1.25 w-1.25 rounded-full bg-current" />
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
}: {
  invoices: FinanceInvoice[];
  onRecordPayment: (invoice: FinanceInvoice) => void;
  onViewDetails: (invoice: FinanceInvoice) => void;
  onDownloadPdf: (invoice: FinanceInvoice) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-260 w-full border-collapse">
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
                <td className="px-5 py-3.25 font-mono text-[12.5px] text-on-background">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-5 py-3.25">
                  <div className="text-[13px] font-semibold text-on-background">
                    {invoice.projectName}
                  </div>
                  <div className="text-[12px] text-on-surface-muted">
                    {invoice.clientName}
                  </div>
                </td>
                <td className="px-5 py-3.25 font-mono text-[12.5px] text-on-background">
                  {formatCurrency(invoice.invoiceAmount)}
                </td>
                <td className="px-5 py-3.25 font-mono text-[12.5px] text-on-background">
                  {formatCurrency(invoice.paidAmount)}
                </td>
                <td
                  className={`px-5 py-3.25 font-mono text-[12.5px] font-semibold ${
                    invoice.status === "OVERDUE"
                      ? "text-error"
                      : invoice.outstandingBalance > 0
                        ? "text-risk-medium"
                        : "text-on-background"
                  }`}
                >
                  {formatCurrency(invoice.outstandingBalance)}
                </td>
                <td className="px-5 py-3.25">
                  <FinanceStatusBadge status={invoice.status} />
                </td>
                <td
                  className={`px-5 py-3.25 text-[12px] ${
                    invoice.status === "OVERDUE"
                      ? "font-semibold text-error"
                      : "text-on-surface-muted"
                  }`}
                >
                  {invoice.previewDueNote || formatDate(invoice.dueDate)}
                </td>
                <td className="px-5 py-3.25">
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
      <div className="space-y-3.5 p-5">
        {unavailableMessage ? (
          <div className="rounded-lg border border-primary/20 bg-primary-soft px-3 py-2 text-xs text-on-surface-variant">
            {unavailableMessage}
          </div>
        ) : null}
        <div>
          <label className="mb-1.25 block text-[11.5px] font-semibold text-on-surface-variant">
            Invoice
          </label>
          <select
            value={values.invoiceId}
            onChange={(event) =>
              onChange("invoiceId", event.target.value, true)
            }
            className={`w-full rounded-lg border px-3 py-2.25 text-[13px] text-on-background outline-none ${
              errors.invoiceId
                ? "border-error bg-error-container"
                : "border-outline-variant bg-surface-container"
            }`}
          >
            <option value="">Select invoice</option>
            {invoices
              .filter(
                (invoice) =>
                  invoice.outstandingBalance > 0 &&
                  ["PENDING", "OVERDUE", "PARTIAL"].includes(invoice.status),
              )
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
          <label className="mb-1.25 block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Amount (LKR)
          </label>
          <input
            type="number"
            value={values.paymentAmount}
            onChange={(event) => onChange("paymentAmount", event.target.value)}
            placeholder="0.00"
            className={`w-full rounded-lg border px-3 py-2.25 font-mono text-[13px] text-on-background outline-none ${
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
          <label className="mb-1.25 block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Method
          </label>
          <select
            value={values.paymentMethod}
            onChange={(event) => onChange("paymentMethod", event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2.25 text-[13px] text-on-background outline-none"
          >
            {[defaultFinancePaymentMethod, "Cheque", "Cash", "Online"].map(
              (method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label className="mb-1.25 block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Date
          </label>
          <input
            type="date"
            value={values.paymentDate}
            onChange={(event) => onChange("paymentDate", event.target.value)}
            className={`w-full rounded-lg border px-3 py-2.25 text-[13px] text-on-background outline-none ${
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
          <label className="mb-1.25 block text-[11.5px] font-semibold text-on-surface-variant">
            Payment Reference
          </label>
          <input
            type="text"
            value={values.paymentReference}
            onChange={(event) =>
              onChange("paymentReference", event.target.value)
            }
            placeholder="Bank reference or cheque number"
            className={`w-full rounded-lg border px-3 py-2.25 text-[13px] text-on-background outline-none ${
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
          <label className="mb-1.25 block text-[11.5px] font-semibold text-on-surface-variant">
            Reference / Notes
          </label>
          <textarea
            value={values.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            placeholder="Bank ref, cheque number, notes..."
            className="h-17.5 w-full resize-none rounded-lg border border-outline-variant bg-surface-container px-3 py-2.25 text-[13px] text-on-background outline-none placeholder:text-on-surface-muted"
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
  const user = useSelector((state: RootState) => state.auth.user);
  if (!user) return <p role="status">Loading finance…</p>;
  if (!canCreateFinanceInvoice(user.role))
    return <p role="alert">You do not have access to finance.</p>;
  return <FinanceDashboardContent key={`${user.id}:${user.role}`} />;
}

function FinanceDashboardContent() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const loadFinanceForUser = useCallback(() => loadFinanceData(user), [user]);

  const query = useDashboardQuery("finance:overview", loadFinanceForUser);
  const financeState: FinanceState =
    query.data ??
    (query.error
      ? {
          kind: "error",
          message: getFinanceErrorMessage(
            query.error,
            "Finance data could not be loaded right now.",
          ),
        }
      : { kind: "loading" });
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
  const [detailsId, setDetailsId] = useState("");
  const loadDetails = useCallback(
    () => getFinanceInvoice(detailsId),
    [detailsId],
  );
  const detailsQuery = useDashboardQuery(
    `finance:invoice:${detailsId}`,
    loadDetails,
    Boolean(detailsId),
  );
  const invoiceDetails = detailsId ? detailsQuery.data : undefined;
  const isLoadingDetails = detailsQuery.loading;
  const paymentPanelRef = useRef<HTMLElement | null>(null);

  const retryLoad = () => {
    void query.refresh();
  };

  const invoices = financeState.kind === "ready" ? financeState.invoices : [];
  const summary =
    financeState.kind === "ready"
      ? financeState.summary
      : {
          totalInvoiceValue: 0,
          totalPaidAmount: 0,
          outstandingBalance: 0,
          overdueAmount: 0,
        };

  const filteredInvoices = filterInvoices(invoices, activeFilter);
  const outstandingBalances = buildOutstandingBalances(invoices);
  const paidInvoiceCount = invoices.filter(
    (invoice) => invoice.status === "PAID",
  ).length;
  const overdueInvoiceCount = invoices.filter(
    (invoice) => invoice.status === "OVERDUE",
  ).length;
  const collectionRate = summary.totalInvoiceValue
    ? (summary.totalPaidAmount / summary.totalInvoiceValue) * 100
    : 0;
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
    setDetailsId(invoice.id);
    setFeedback(null);
  };

  const handleDownloadPdf = (invoice: FinanceInvoice) => {
    void (async () => {
      try {
        const updatedInvoice = await generateFinanceInvoicePdf(invoice.id);
        const pdfUrl = updatedInvoice.pdfUrl ?? invoice.pdfUrl;

        if (!pdfUrl) {
          setFeedback({
            tone: "info",
            message: `Invoice PDF is still being prepared for ${invoice.invoiceNumber}.`,
          });
          return;
        }

        window.open(pdfUrl, "_blank", "noopener,noreferrer");
        setFeedback({
          tone: "success",
          message: `Invoice PDF is ready for ${invoice.invoiceNumber}.`,
        });
      } catch (error) {
        setFeedback({
          tone: "error",
          message: getFinanceErrorMessage(
            error,
            "Invoice PDF could not be generated right now.",
          ),
        });
      }
    })();
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
      await recordFinancePayment(paymentFormValues);
      await query.refresh();
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
          message: getFinanceErrorMessage(
            error,
            "Payment could not be recorded right now.",
          ),
        });
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const invoiceCreation = (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreatingInvoice(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          <Plus size={16} /> Create Invoice
        </button>
      </div>
      {creatingInvoice && (
        <CreateInvoiceForm
          onClose={() => setCreatingInvoice(false)}
          onCreated={(invoice) => {
            setCreatingInvoice(false);
            setActiveFilter("ALL");
            setFeedback({
              tone: "success",
              message: `${invoice.invoiceNumber} created successfully.`,
            });
          }}
        />
      )}
      {feedback ? <FinanceFeedbackBanner feedback={feedback} /> : null}
    </>
  );

  if (financeState.kind === "error") {
    return (
      <div className="space-y-5">
        {invoiceCreation}
        <FinanceStateCard
          title="Finance dashboard unavailable"
          message={financeState.message}
          actionLabel="Try again"
          onAction={retryLoad}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {invoiceCreation}
      {query.error ? (
        <FinanceFeedbackBanner
          feedback={{
            tone: "error",
            message: "Refresh failed. Showing previously loaded invoice data.",
          }}
        />
      ) : null}
      {query.error ? (
        <button className="text-sm text-primary underline" onClick={retryLoad}>
          Retry refresh
        </button>
      ) : null}
      {detailsQuery.error && detailsId ? (
        <FinanceFeedbackBanner
          feedback={{
            tone: "error",
            message: getFinanceErrorMessage(
              detailsQuery.error,
              "Invoice details could not be refreshed.",
            ),
          }}
        />
      ) : null}
      {detailsQuery.error && detailsId ? (
        <button
          className="text-sm text-primary underline"
          onClick={() => void detailsQuery.refresh()}
        >
          Retry invoice details
        </button>
      ) : null}
      {isLoadingDetails ? (
        <section
          className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
          aria-hidden="true"
        >
          <div className="h-5 w-40 animate-pulse rounded bg-surface-container" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-container" />
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-lg bg-surface-container"
              />
            ))}
          </div>
        </section>
      ) : invoiceDetails ? (
        <section
          className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-level-1"
          aria-label="Invoice details"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-on-background">
                {invoiceDetails.invoiceNumber}
              </h2>
              <p className="mt-1 text-sm text-on-surface-muted">
                {invoiceDetails.projectName} · {invoiceDetails.clientName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDetailsId("")}
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant"
            >
              Close
            </button>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-on-surface-muted">Invoice date</dt>
              <dd className="mt-1 font-medium text-on-background">
                {formatDate(invoiceDetails.invoiceDate)}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-muted">Due date</dt>
              <dd className="mt-1 font-medium text-on-background">
                {formatDate(invoiceDetails.dueDate)}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-muted">Total</dt>
              <dd className="mt-1 font-mono text-on-background">
                {formatCurrency(invoiceDetails.invoiceAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-muted">Paid</dt>
              <dd className="mt-1 font-mono text-on-background">
                {formatCurrency(invoiceDetails.paidAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-muted">Outstanding</dt>
              <dd className="mt-1 font-mono text-on-background">
                {formatCurrency(invoiceDetails.outstandingBalance)}
              </dd>
            </div>
          </dl>
          {invoiceDetails.notes ? (
            <p className="mt-4 text-sm text-on-surface-variant">
              {invoiceDetails.notes}
            </p>
          ) : null}
        </section>
      ) : null}

      {financeState.kind === "loading" ? (
        <section className="grid gap-4 xl:grid-cols-4" aria-hidden="true">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl border border-outline-variant bg-surface-container-lowest"
            />
          ))}
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-4">
          <FinanceSummaryCard
            label="Total Invoiced"
            value={formatCompactCurrency(summary.totalInvoiceValue)}
            sublabel={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
            tone="success"
          />
          <FinanceSummaryCard
            label="Collected"
            value={formatCompactCurrency(summary.totalPaidAmount)}
            sublabel={`${collectionRate.toFixed(1)}% collection rate`}
            tone="success"
          />
          <FinanceSummaryCard
            label="Outstanding"
            value={formatCompactCurrency(summary.outstandingBalance)}
            sublabel={`${overdueInvoiceCount} invoice${overdueInvoiceCount === 1 ? "" : "s"} overdue`}
            tone="warning"
          />
          <FinanceSummaryCard
            label="Overdue"
            value={formatCompactCurrency(summary.overdueAmount)}
            sublabel={`${paidInvoiceCount} invoice${paidInvoiceCount === 1 ? "" : "s"} fully paid`}
            tone="default"
          />
        </section>
      )}

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
