"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import { getLead } from "@/components/dashboard/leads/leadApi";
import { quotationActions, safePdfUrl } from "@/lib/quotationActions";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { ApiError } from "@/lib/ApiError";
import {
  approveQuotation,
  createQuotation,
  getQuotationById,
  getQuotationPdf,
  listQuotations,
  reviseQuotation,
  submitQuotation,
} from "@/services/quotationsApi";
import LeadSelectDropdown from "@/components/dashboard/quotations/LeadSelectDropdown";
import type {
  Quotation,
  QuotationFilterTab,
  QuotationFormErrors,
  QuotationFormValues,
  QuotationItemInput,
} from "@/types/quotation";
import {
  calculateTotalAmount,
  canApproveQuotation,
  canCreateQuotation,
  canRejectQuotation,
  createQuotationFormValues,
  formatCurrency,
  formatDate,
  getQuotationErrorMessage,
  getQuotationStatusBadgeClasses,
  getQuotationStatusLabel,
  normalizeQuotations,
  paginateQuotations,
  quotationFilterTabs,
  validateQuotationForm,
} from "@/components/dashboard/quotations/quotationUtils";
import EditQuotationModal from "@/components/dashboard/quotations/modals/EditQuotationModal";
import RejectQuotationModal from "@/components/dashboard/quotations/modals/RejectQuotationModal";
import ConvertToProjectModal from "@/components/dashboard/quotations/modals/ConvertToProjectModal";

type QuotationsState =
  | { kind: "loading" }
  | {
      kind: "ready";
      quotations: Quotation[];
      total?: number;
      totalPages?: number;
    }
  | { kind: "empty" }
  | { kind: "error"; message: string };

type QuotationFeedback = {
  tone: "success" | "error" | "info";
  message: string;
};

function QuotationStatusBadge({ status }: { status: Quotation["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[11px] font-semibold ${getQuotationStatusBadgeClasses(
        status,
      )}`}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-current" />
      {getQuotationStatusLabel(status)}
    </span>
  );
}

function QuotationStateCard({
  title,
  message,
  onRetry,
  action,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="rounded-xl border border-dashed border-outline bg-surface-container-lowest p-8 text-center shadow-level-1">
      <h2 className="text-lg font-semibold text-on-background">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-on-primary hover:bg-primary-hover transition shadow-xs"
        >
          <RefreshCcw size={13} />
          Retry
        </button>
      ) : action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-on-primary hover:bg-primary-hover transition shadow-xs"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

function QuotationFeedbackBanner({
  feedback,
}: {
  feedback: QuotationFeedback;
}) {
  const toneClasses =
    feedback.tone === "success"
      ? "border-risk-low/20 bg-risk-low-container text-risk-low"
      : feedback.tone === "error"
        ? "border-error/20 bg-error-container text-on-error-container"
        : "border-primary/20 bg-primary-soft text-on-surface-variant";

  return (
    <div
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${toneClasses}`}
    >
      {feedback.message}
    </div>
  );
}

function QuotationForm({
  values,
  errors,
  isSubmitting,
  lockedLead = false,
  onFieldChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
}: {
  values: QuotationFormValues;
  errors: QuotationFormErrors;
  isSubmitting: boolean;
  lockedLead?: boolean;
  onFieldChange: (field: "leadId" | "notes", value: string) => void;
  onItemChange: (
    index: number,
    field: keyof QuotationItemInput,
    value: string,
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: () => void;
}) {
  const liveTotal = calculateTotalAmount(values.items);

  return (
    <section
      id="create-quotation-panel"
      className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-1"
    >
      <div className="border-b border-outline-variant px-5 py-4">
        <h2 className="text-[14px] font-bold text-on-background">
          Generate Quotation
        </h2>
        <p className="mt-0.5 text-[11.5px] text-on-surface-muted">
          Create a new quotation for a lead
        </p>
      </div>
      <div className="space-y-[14px] p-5">
        <LeadSelectDropdown
          value={values.leadId}
          onChange={(leadId) => onFieldChange("leadId", leadId)}
          error={errors.leadId}
          disabled={isSubmitting || lockedLead}
        />

        <div>
          <div className="mb-[5px] flex items-center justify-between">
            <label
              id="quotation-form-items-label"
              className="block text-[11.5px] font-semibold text-on-surface-variant"
            >
              Items
            </label>
            <button
              type="button"
              onClick={onAddItem}
              disabled={isSubmitting}
              aria-label="Add item to quotation"
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1 text-xs font-medium text-on-background transition hover:bg-surface-container-high"
            >
              <Plus size={12} />
              Add Item
            </button>
          </div>
          <div
            className="space-y-2"
            aria-labelledby="quotation-form-items-label"
          >
            {values.items.map((item, index) => {
              return (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_65px_95px_auto] items-start gap-2"
                >
                  <input
                    type="text"
                    value={item.itemName}
                    disabled={isSubmitting}
                    aria-label={`Item ${index + 1} name`}
                    aria-invalid={Boolean(errors.items)}
                    aria-describedby={
                      errors.items ? "quotation-items-error" : undefined
                    }
                    onChange={(event) =>
                      onItemChange(index, "itemName", event.target.value)
                    }
                    placeholder="Item name"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] text-[13px] text-on-background outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity === 0 ? "" : item.quantity}
                    disabled={isSubmitting}
                    aria-label={`Item ${index + 1} quantity`}
                    aria-invalid={Boolean(errors.items)}
                    aria-describedby={
                      errors.items ? "quotation-items-error" : undefined
                    }
                    onChange={(event) =>
                      onItemChange(index, "quantity", event.target.value)
                    }
                    placeholder="Qty"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-[9px] font-mono text-[13px] text-on-background outline-none text-right"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice === 0 ? "" : item.unitPrice}
                    disabled={isSubmitting}
                    aria-label={`Item ${index + 1} unit price`}
                    aria-invalid={Boolean(errors.items)}
                    aria-describedby={
                      errors.items ? "quotation-items-error" : undefined
                    }
                    onChange={(event) =>
                      onItemChange(index, "unitPrice", event.target.value)
                    }
                    placeholder="Unit price"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-[9px] font-mono text-[13px] text-on-background outline-none text-right"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    disabled={isSubmitting || values.items.length === 1}
                    aria-label={`Remove item ${index + 1}`}
                    className="rounded-lg border border-outline-variant bg-surface-container p-[9px] text-on-surface-muted transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          {errors.items ? (
            <p id="quotation-items-error" className="mt-1 text-xs text-error">
              {errors.items}
            </p>
          ) : null}

          <div className="mt-2.5 flex items-center justify-end gap-2 text-xs">
            <span className="text-on-surface-muted">Total:</span>
            <span className="font-mono font-bold text-on-background">
              {formatCurrency(liveTotal)}
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="create-quotation-notes"
            className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant"
          >
            Notes
          </label>
          <textarea
            id="create-quotation-notes"
            value={values.notes}
            disabled={isSubmitting}
            aria-label="Optional notes for this quotation"
            onChange={(event) => onFieldChange("notes", event.target.value)}
            placeholder="Optional notes for this quotation..."
            className="h-[70px] w-full resize-none rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] text-[13px] text-on-background outline-none placeholder:text-on-surface-muted"
          />
        </div>
      </div>
      <div className="flex gap-2 border-t border-outline-variant px-5 py-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Check size={14} />
          {isSubmitting ? "Generating..." : "Generate Quotation"}
        </button>
      </div>
    </section>
  );
}

function QuotationCard({
  quotation,
  canApprove,
  canReject,
  isGeneratingPdf,
  isRevising,
  isApproving,
  onEdit,
  onApprove,
  onReject,
  onRevise,
  onConvert,
  onDownloadPdf,
  onSubmitDraft,
  role,
}: {
  quotation: Quotation;
  role: string | null | undefined;
  onSubmitDraft: (quotation: Quotation) => void;
  canApprove: boolean;
  canReject: boolean;
  isGeneratingPdf: boolean;
  isRevising: boolean;
  isApproving: boolean;
  onEdit: (quotation: Quotation) => void;
  onApprove: (quotation: Quotation) => void;
  onReject: (quotation: Quotation) => void;
  onRevise: (quotation: Quotation) => void;
  onConvert: (quotation: Quotation) => void;
  onDownloadPdf: (quotation: Quotation) => void;
}) {
  const actions = quotationActions(role, quotation.status);
  const isEditable = actions.edit;
  const isConvertible = actions.convert && canApprove;
  const isRejectable = actions.reject && canReject;
  const isRevisable = actions.revise;
  const busy = isApproving || isRevising;

  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-1 transition hover:shadow-level-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-on-background">
              {quotation.lead?.customerName ? (
                <span>{quotation.lead.customerName}</span>
              ) : (
                <span>Lead {quotation.leadId}</span>
              )}
            </p>
            <span className="font-mono text-xs text-on-surface-subtle">
              ({quotation.id})
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-on-surface-muted">
            Date: {formatDate(quotation.quotationDate)}
            {quotation.lead?.customerName
              ? ` &bull; Lead: ${quotation.leadId}`
              : ""}
          </p>
        </div>
        <QuotationStatusBadge status={quotation.status} />
      </div>

      {quotation.lead ? (
        <div className="px-5 pt-3 text-xs text-on-surface-muted">
          <p>
            {quotation.lead.email || "No email provided"} |{" "}
            {quotation.lead.phone || "No phone provided"}
          </p>
        </div>
      ) : null}
      {/* Line Items Table */}
      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-outline-variant">
                <th
                  scope="col"
                  className="py-2 text-left font-semibold uppercase tracking-[0.06em] text-[11px] text-on-surface-muted"
                >
                  Item
                </th>
                <th
                  scope="col"
                  className="py-2 text-right font-semibold uppercase tracking-[0.06em] text-[11px] text-on-surface-muted"
                >
                  Qty
                </th>
                <th
                  scope="col"
                  className="py-2 text-right font-semibold uppercase tracking-[0.06em] text-[11px] text-on-surface-muted"
                >
                  Unit Price
                </th>
                <th
                  scope="col"
                  className="py-2 text-right font-semibold uppercase tracking-[0.06em] text-[11px] text-on-surface-muted"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item) => (
                <tr key={item.id} className="border-b border-outline-variant">
                  <td className="py-[9px] text-on-background font-medium">
                    {item.itemName}
                  </td>
                  <td className="py-[9px] text-right font-mono text-on-background">
                    {item.quantity}
                  </td>
                  <td className="py-[9px] text-right font-mono text-on-background">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-[9px] text-right font-mono font-semibold text-on-background">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card Footer Summary & Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-3.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-on-surface-muted">Total Amount:</span>
            <span className="text-[14px] font-mono font-bold text-on-background">
              {formatCurrency(quotation.totalAmount)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* PDF View / Download Button (Always enabled) */}
            <button
              type="button"
              onClick={() => onDownloadPdf(quotation)}
              disabled={isGeneratingPdf}
              aria-label={`Download or view PDF for quotation ${quotation.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-background transition hover:bg-surface-container-high disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <Loader2 size={13} className="animate-spin text-primary" />
              ) : (
                <FileText size={13} />
              )}
              {isGeneratingPdf
                ? "Generating PDF..."
                : quotation.pdfUrl
                  ? "View PDF"
                  : "Download PDF"}
            </button>

            {/* Edit Quotation Button: Visible on DRAFT and PENDING_APPROVAL, hidden/locked on APPROVED and CONVERTED */}
            {isEditable ? (
              <button
                type="button"
                onClick={() => onEdit(quotation)}
                disabled={busy}
                aria-label={`Edit quotation ${quotation.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-semibold text-on-background transition hover:bg-surface-container-high"
              >
                <Pencil size={13} />
                Edit Quotation
              </button>
            ) : null}

            {/* Reject Button: Visible on PENDING_APPROVAL for Admin/Sales Manager */}
            {isRejectable ? (
              <button
                type="button"
                onClick={() => onReject(quotation)}
                disabled={busy}
                aria-label={`Reject quotation ${quotation.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-error/20 bg-error-container px-2.5 py-1.5 text-xs font-semibold text-error transition hover:bg-error-hover/20"
              >
                <Ban size={13} />
                Reject
              </button>
            ) : null}

            {/* Revise Button: Visible on REJECTED */}
            {isRevisable ? (
              <button
                type="button"
                onClick={() => onRevise(quotation)}
                disabled={isRevising}
                aria-label={`Revise quotation ${quotation.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-semibold text-on-background transition hover:bg-surface-container-high disabled:opacity-60"
              >
                <RefreshCcw
                  size={13}
                  className={isRevising ? "animate-spin" : ""}
                />
                {isRevising ? "Revising..." : "Revise Quotation"}
              </button>
            ) : null}

            {actions.submit ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onSubmitDraft(quotation)}
                aria-label={`Submit quotation ${quotation.id} for approval`}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary disabled:opacity-60"
              >
                {busy ? "Submitting..." : "Submit for Approval"}
              </button>
            ) : null}
            {/* Direct Approve Action: Visible on PENDING_APPROVAL for Admin/Sales Manager */}
            {actions.approve ? (
              <button
                type="button"
                onClick={() => onApprove(quotation)}
                disabled={isApproving}
                aria-label={`Approve quotation ${quotation.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-risk-low/30 bg-risk-low-container px-2.5 py-1.5 text-xs font-semibold text-risk-low transition hover:bg-risk-low/20 disabled:opacity-60"
              >
                {isApproving ? (
                  <Loader2 size={13} className="animate-spin text-risk-low" />
                ) : (
                  <Check size={13} />
                )}
                {isApproving ? "Approving..." : "Approve"}
              </button>
            ) : null}

            {/* Convert to Project Button: Visible on PENDING_APPROVAL and APPROVED for Admin/Sales Manager */}
            {isConvertible ? (
              <button
                type="button"
                onClick={() => onConvert(quotation)}
                disabled={busy}
                aria-label={`Convert quotation ${quotation.id} to project`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition hover:bg-primary-hover shadow-xs"
              >
                <FolderKanban size={13} />
                Convert to Project
              </button>
            ) : null}

            {/* Link to converted project if CONVERTED */}
            {quotation.status === "CONVERTED" && quotation.projectId ? (
              <Link
                href={`/dashboard/projects/${encodeURIComponent(quotation.projectId)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-container"
              >
                <FolderKanban size={13} />
                Converted to Project {quotation.projectId}
                <ExternalLink size={12} />
              </Link>
            ) : null}
          </div>
        </div>

        {/* Informative notes / rejection notices */}
        {quotation.status === "REJECTED" ? (
          <div className="mt-3 rounded-lg border border-error/20 bg-error-container/50 p-2.5 text-xs text-on-error-container">
            <p className="font-semibold text-error">
              Quotation Rejected &bull; Cannot convert to project
            </p>
            {quotation.notes ? (
              <p className="mt-0.5 text-on-surface-variant">
                {quotation.notes}
              </p>
            ) : (
              <p className="mt-0.5 text-on-surface-variant">
                Click &ldquo;Revise Quotation&rdquo; to reset status to Draft
                and unlock editing.
              </p>
            )}
          </div>
        ) : quotation.notes ? (
          <p className="mt-3 text-[11.5px] text-on-surface-muted italic">
            Notes: {quotation.notes}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function QuotationsDashboardClient({
  initialLeadId = "",
  initialQuotationId = "",
}: {
  initialLeadId?: string;
  initialQuotationId?: string;
}) {
  const creatingRef = useRef(false);
  const pendingActions = useRef(new Set<string>());
  const user = useSelector((state: RootState) => state.auth.user);

  const [activeTab, setActiveTab] = useState<QuotationFilterTab>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [formValues, setFormValues] = useState<QuotationFormValues>({
    ...createQuotationFormValues(),
    leadId: initialLeadId,
  });
  const [formErrors, setFormErrors] = useState<QuotationFormErrors>({});
  const [feedback, setFeedback] = useState<QuotationFeedback | null>(null);
  const [convertedProjectId, setConvertedProjectId] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active modal targets
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(
    null,
  );
  const [rejectingQuotation, setRejectingQuotation] =
    useState<Quotation | null>(null);
  const [convertingQuotation, setConvertingQuotation] =
    useState<Quotation | null>(null);

  // Async tracking per card
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Debounce search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchQuotationsData =
    useCallback(async (): Promise<QuotationsState> => {
      if (
        initialQuotationId &&
        activeTab === "ALL" &&
        !debouncedSearch.trim()
      ) {
        const quotation = await getQuotationById(initialQuotationId);
        return { kind: "ready", quotations: normalizeQuotations([quotation]) };
      }
      const res = await listQuotations({
        status: activeTab,
        leadId: initialLeadId || undefined,
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
      });
      const items = normalizeQuotations(res);
      return items.length
        ? {
            kind: "ready",
            quotations: items,
            total: res.total,
            totalPages: res.totalPages ?? 1,
          }
        : { kind: "empty" };
    }, [
      initialQuotationId,
      initialLeadId,
      activeTab,
      debouncedSearch,
      currentPage,
    ]);

  const query = useDashboardQuery<QuotationsState>(
    JSON.stringify([
      "quotations",
      initialLeadId,
      initialQuotationId,
      activeTab,
      debouncedSearch.trim(),
      currentPage,
    ]),
    fetchQuotationsData,
  );
  const quotationsState: QuotationsState =
    query.data ??
    (query.error
      ? { kind: "error", message: getQuotationErrorMessage(query.error) }
      : { kind: "loading" });
  const setQuotationsState = (
    update: (current: QuotationsState) => QuotationsState,
  ) => query.setData((current) => update(current ?? { kind: "loading" }));
  const replaceQuotationInState = (updated: Quotation) => {
    // Keep matching rows current while the invalidated list refreshes its counts and membership.
    setQuotationsState((current) =>
      current.kind === "ready"
        ? {
            ...current,
            quotations: current.quotations.map((quotation) =>
              quotation.id === updated.id ? updated : quotation,
            ),
          }
        : current,
    );
    void query.refresh();
  };
  const loadQuotations = () => {
    void query.refresh();
  };
  const handleTabChange = (tabId: QuotationFilterTab) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const allQuotations =
    quotationsState.kind === "ready" ? quotationsState.quotations : [];

  const {
    items: paginatedQuotations,
    total: totalCount,
    totalPages,
    startIndex,
    endIndex,
  } = quotationsState.kind === "ready"
    ? {
        items: allQuotations,
        total: quotationsState.total ?? allQuotations.length,
        totalPages: quotationsState.totalPages ?? 1,
        startIndex: allQuotations.length ? (currentPage - 1) * pageSize + 1 : 0,
        endIndex: (currentPage - 1) * pageSize + allQuotations.length,
      }
    : paginateQuotations(allQuotations, currentPage, pageSize);

  const handleFieldChange = (field: "leadId" | "notes", value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  };

  const handleItemChange = (
    index: number,
    field: keyof QuotationItemInput,
    value: string,
  ) => {
    setFormValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (field === "itemName") {
          return { ...item, itemName: value };
        }

        const parsed = Number(value);
        return { ...item, [field]: Number.isNaN(parsed) ? 0 : parsed };
      }),
    }));
    setFormErrors((current) => ({ ...current, items: undefined }));
    setFeedback(null);
  };

  const handleAddItem = () => {
    setFormValues((current) => ({
      ...current,
      items: [...current.items, { itemName: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormValues((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  // PDF Download / View handler
  const handleDownloadPdf = async (quotation: Quotation) => {
    const key = `pdf:${quotation.id}`;
    if (pendingActions.current.has(key)) return;
    const tab = window.open("", "_blank");
    if (!tab) {
      setFeedback({
        tone: "error",
        message: "Allow pop-ups to open the quotation PDF, then try again.",
      });
      return;
    }
    tab.opener = null;
    pendingActions.current.add(key);
    setPdfLoadingId(quotation.id);
    try {
      const pdfUrl = safePdfUrl(
        quotation.pdfUrl ?? (await getQuotationPdf(quotation.id)).pdfUrl,
      );
      replaceQuotationInState({ ...quotation, pdfUrl });
      tab.location.href = pdfUrl;
    } catch {
      tab.close();
      setFeedback({
        tone: "error",
        message: "Failed to generate quotation PDF. Please try again.",
      });
    } finally {
      pendingActions.current.delete(key);
      setPdfLoadingId(null);
    }
  };

  const handleSubmitDraft = async (quotation: Quotation) => {
    if (
      !quotationActions(user?.role, quotation.status).submit ||
      pendingActions.current.has(quotation.id)
    )
      return;
    pendingActions.current.add(quotation.id);
    setApprovingId(quotation.id);
    try {
      replaceQuotationInState(await submitQuotation(quotation.id));
    } catch (error) {
      setFeedback({ tone: "error", message: getQuotationErrorMessage(error) });
    } finally {
      pendingActions.current.delete(quotation.id);
      setApprovingId(null);
    }
  };

  // Revise handler: moves REJECTED -> DRAFT
  const handleReviseQuotation = async (quotation: Quotation) => {
    if (
      !quotationActions(user?.role, quotation.status).revise ||
      pendingActions.current.has(quotation.id)
    )
      return;
    pendingActions.current.add(quotation.id);
    setRevisingId(quotation.id);
    setFeedback(null);
    try {
      const revised = await reviseQuotation(quotation.id);
      replaceQuotationInState(revised);
      setFeedback({
        tone: "info",
        message:
          "Quotation moved back to Draft. You can now edit line items and re-submit.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getQuotationErrorMessage(error),
      });
    } finally {
      pendingActions.current.delete(quotation.id);
      setRevisingId(null);
    }
  };

  // Direct Approve handler: moves PENDING_APPROVAL -> APPROVED
  const handleApproveQuotation = async (quotation: Quotation) => {
    if (
      !quotationActions(user?.role, quotation.status).approve ||
      pendingActions.current.has(quotation.id)
    ) {
      return;
    }

    pendingActions.current.add(quotation.id);
    setApprovingId(quotation.id);
    setFeedback(null);

    try {
      // Approval is separate from conversion to a project.
      const updated = await approveQuotation(quotation.id);

      replaceQuotationInState(updated);

      setFeedback({
        tone: "success",
        message: `Quotation ${quotation.id} approved successfully. You can now convert it to a project.`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getQuotationErrorMessage(error),
      });
    } finally {
      pendingActions.current.delete(quotation.id);
      setApprovingId(null);
    }
  };

  // Create Quotation form submission
  const handleSubmit = async () => {
    if (!canCreateQuotation(user?.role) || creatingRef.current) return;
    const validationErrors = validateQuotationForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setFeedback({
        tone: "error",
        message: "Please correct the highlighted quotation form errors.",
      });
      return;
    }

    creatingRef.current = true;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await getLead(formValues.leadId.trim());
      let createdQuotation = await createQuotation({
        leadId: formValues.leadId.trim(),
        notes: formValues.notes.trim() || undefined,
        items: formValues.items.map((it) => ({
          itemName: it.itemName.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      });

      try {
        const refreshedResponse = await getQuotationById(createdQuotation.id);
        createdQuotation = refreshedResponse;
      } catch {
        // Read-path confirmation is best-effort
      }

      setQuotationsState((current) => {
        const existing = current.kind === "ready" ? current.quotations : [];

        return { kind: "ready", quotations: [createdQuotation, ...existing] };
      });
      void query.refresh();
      setFormValues({ ...createQuotationFormValues(), leadId: initialLeadId });
      setFormErrors({});
      setFeedback({
        tone: "success",
        message: `Quotation generated successfully for lead ${formValues.leadId}.`,
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        setFeedback({
          tone: "error",
          message: error.message,
        });
      } else if (error instanceof ApiError && error.code === "LEAD_NOT_FOUND") {
        setFeedback({
          tone: "error",
          message: "The selected lead could not be found.",
        });
      } else {
        setFeedback({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Quotation could not be generated right now.",
        });
      }
    } finally {
      creatingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {query.error && query.data ? (
        <div role="status" className="text-sm text-error">
          {getQuotationErrorMessage(query.error)}{" "}
          <button type="button" onClick={loadQuotations}>
            Retry refresh
          </button>
        </div>
      ) : null}
      {/* Feedback Banner */}
      {feedback ? <QuotationFeedbackBanner feedback={feedback} /> : null}
      {convertedProjectId && (
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline"
          href={`/dashboard/projects/${convertedProjectId}`}
        >
          Open linked project <ExternalLink size={14} />
        </Link>
      )}

      {/* Main Grid: Quotations List + Create Quotation Form */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column: Filter Tabs, Search Bar & Cards */}
        <div className="flex flex-col gap-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest p-1.5 shadow-level-1">
            {quotationFilterTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  aria-pressed={activeTab === tab.id}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-background"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search
              size={15}
              className="absolute left-3.5 text-on-surface-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by customer name or notes..."
              aria-label="Search quotations"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-10 pr-9 py-2.5 text-xs text-on-background outline-none transition placeholder:text-on-surface-muted focus:border-primary shadow-level-1"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Clear search"
                className="absolute right-3 rounded-md p-1 text-on-surface-muted hover:bg-surface-container hover:text-on-background transition"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          {/* Cards or Empty/Loading State */}
          {quotationsState.kind === "loading" ? (
            <>
              <div className="space-y-3" aria-hidden="true">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
                      <div className="h-6 w-20 animate-pulse rounded-full bg-surface-container" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[1, 2, 3].map((line) => (
                        <div
                          key={line}
                          className="h-10 animate-pulse rounded-lg bg-surface-container"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : quotationsState.kind === "error" ? (
            <QuotationStateCard
              title="Failed to Load Quotations"
              message={quotationsState.message}
              onRetry={loadQuotations}
            />
          ) : allQuotations.length === 0 ? (
            debouncedSearch.trim() ? (
              <QuotationStateCard
                title="No matching quotations"
                message={`No quotations match the search term "${debouncedSearch}". Try adjusting your keywords or clearing the search.`}
                action={{
                  label: "Clear Search",
                  onClick: () => handleSearchChange(""),
                }}
              />
            ) : (
              <QuotationStateCard
                title={
                  activeTab === "ALL"
                    ? "No quotations created yet"
                    : `No ${activeTab.toLowerCase().replaceAll("_", " ")} quotations found`
                }
                message={
                  activeTab === "ALL"
                    ? "No quotations found in the system. Use the form on the right to generate your first quotation."
                    : `There are currently no quotations matching the "${activeTab}" filter.`
                }
              />
            )
          ) : (
            <>
              {paginatedQuotations.map((quotation) => (
                <QuotationCard
                  key={quotation.id}
                  quotation={quotation}
                  role={user?.role}
                  onSubmitDraft={handleSubmitDraft}
                  canApprove={canApproveQuotation(user?.role)}
                  canReject={canRejectQuotation(user?.role)}
                  isGeneratingPdf={pdfLoadingId === quotation.id}
                  isRevising={revisingId === quotation.id}
                  isApproving={approvingId === quotation.id}
                  onEdit={(q) => setEditingQuotation(q)}
                  onApprove={handleApproveQuotation}
                  onReject={(q) => setRejectingQuotation(q)}
                  onRevise={handleReviseQuotation}
                  onConvert={(q) => setConvertingQuotation(q)}
                  onDownloadPdf={handleDownloadPdf}
                />
              ))}

              {/* Pagination Controls */}
              {totalCount > pageSize ? (
                <nav
                  aria-label="Quotations pagination"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-xs shadow-level-1"
                >
                  <span className="text-on-surface-muted">
                    Showing{" "}
                    <span className="font-semibold text-on-background">
                      {startIndex}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-on-background">
                      {endIndex}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-on-background">
                      {totalCount}
                    </span>{" "}
                    quotations
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      aria-label="Previous page"
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 font-medium text-on-background transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={13} />
                      Previous
                    </button>
                    <span className="px-2 font-medium text-on-surface-variant">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                      aria-label="Next page"
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 font-medium text-on-background transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </nav>
              ) : null}
            </>
          )}
        </div>

        {/* Right Column: Create Quotation Form */}
        <div>
          {canCreateQuotation(user?.role) ? (
            <QuotationForm
              lockedLead={!!initialLeadId}
              values={formValues}
              errors={formErrors}
              isSubmitting={isSubmitting}
              onFieldChange={handleFieldChange}
              onItemChange={handleItemChange}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onSubmit={handleSubmit}
            />
          ) : (
            <QuotationStateCard
              title="Quotation generation restricted"
              message="Only Admin or Sales Manager roles can generate quotations."
            />
          )}
        </div>
      </section>

      {/* Edit Quotation Modal */}
      {editingQuotation ? (
        <EditQuotationModal
          key={editingQuotation.id}
          quotation={editingQuotation}
          isOpen={Boolean(editingQuotation)}
          onClose={() => setEditingQuotation(null)}
          onSuccess={(updated) => {
            replaceQuotationInState(updated);
            setFeedback({
              tone: "success",
              message: `Quotation ${updated.id} updated successfully.`,
            });
          }}
        />
      ) : null}

      {/* Reject Quotation Modal */}
      {rejectingQuotation ? (
        <RejectQuotationModal
          key={rejectingQuotation.id}
          quotation={rejectingQuotation}
          isOpen={Boolean(rejectingQuotation)}
          onClose={() => setRejectingQuotation(null)}
          onSuccess={(updated) => {
            replaceQuotationInState(updated);
            setFeedback({
              tone: "success",
              message: `Quotation ${updated.id} has been rejected.`,
            });
          }}
        />
      ) : null}

      {/* Convert to Project Modal */}
      {convertingQuotation ? (
        <ConvertToProjectModal
          key={convertingQuotation.id}
          quotation={convertingQuotation}
          isOpen={Boolean(convertingQuotation)}
          onClose={() => setConvertingQuotation(null)}
          onSuccess={async ({
            quotation: updated,
            projectId,
            projectStatus,
          }) => {
            replaceQuotationInState(updated);
            setConvertedProjectId(projectId);
            setFeedback({
              tone: "success",
              message: `Quotation converted successfully. Project: ${projectId}. Status: ${projectStatus ?? "ACTIVE"}`,
            });
            try {
              const refreshed = await getQuotationById(updated.id);
              replaceQuotationInState(refreshed);
              if (refreshed.projectId)
                setConvertedProjectId(refreshed.projectId);
            } catch (error) {
              setFeedback({
                tone: "info",
                message: `Conversion succeeded, but the quotation could not be refreshed: ${getQuotationErrorMessage(error)}`,
              });
            }
          }}
          onAlreadyConverted={(q) => {
            // The conversion modal has already fetched and verified this quotation.
            replaceQuotationInState(q);

            if (q.projectId) {
              setConvertedProjectId(q.projectId);
            }

            setFeedback({
              tone: "info",
              message:
                "This quotation has already been converted to a project.",
            });
          }}
        />
      ) : null}
    </div>
  );
}
