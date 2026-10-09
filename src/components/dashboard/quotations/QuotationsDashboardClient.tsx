"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Ban,
  Check,
  ExternalLink,
  FileText,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
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
  calculateLineItemAmount,
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
  isQuotationUnavailableError,
  normalizeQuotations,
  quotationFilterTabs,
  quotationPreviewList,
  validateQuotationForm,
} from "@/components/dashboard/quotations/quotationUtils";
import EditQuotationModal from "@/components/dashboard/quotations/modals/EditQuotationModal";
import RejectQuotationModal from "@/components/dashboard/quotations/modals/RejectQuotationModal";
import ConvertToProjectModal from "@/components/dashboard/quotations/modals/ConvertToProjectModal";

type QuotationsState =
  | { kind: "loading" }
  | { kind: "ready"; quotations: Quotation[] }
  | { kind: "empty" }
  | { kind: "unavailable"; quotations: Quotation[]; message: string }
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
}: {
  title: string;
  message: string;
  onRetry?: () => void;
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
  unavailableMessage,
  onFieldChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
}: {
  values: QuotationFormValues;
  errors: QuotationFormErrors;
  isSubmitting: boolean;
  unavailableMessage?: string | null;
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
        {unavailableMessage ? (
          <div className="rounded-lg border border-primary/20 bg-primary-soft px-3 py-2 text-xs text-on-surface-variant">
            {unavailableMessage}
          </div>
        ) : null}
        <LeadSelectDropdown
          value={values.leadId}
          onChange={(leadId) => onFieldChange("leadId", leadId)}
          error={errors.leadId}
          disabled={isSubmitting}
        />

        <div>
          <div className="mb-[5px] flex items-center justify-between">
            <label className="block text-[11.5px] font-semibold text-on-surface-variant">
              Items
            </label>
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1 text-xs font-medium text-on-background transition hover:bg-surface-container-high"
            >
              <Plus size={12} />
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {values.items.map((item, index) => {
              calculateLineItemAmount(item.quantity, item.unitPrice);
              return (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_65px_95px_auto] items-start gap-2"
                >
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(event) =>
                      onItemChange(index, "itemName", event.target.value)
                    }
                    placeholder="Item name"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-[9px] text-[13px] text-on-background outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={item.quantity === 0 ? "" : item.quantity}
                    onChange={(event) =>
                      onItemChange(index, "quantity", event.target.value)
                    }
                    placeholder="Qty"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-[9px] font-mono text-[13px] text-on-background outline-none text-right"
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice === 0 ? "" : item.unitPrice}
                    onChange={(event) =>
                      onItemChange(index, "unitPrice", event.target.value)
                    }
                    placeholder="Unit price"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-[9px] font-mono text-[13px] text-on-background outline-none text-right"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    disabled={values.items.length === 1}
                    className="rounded-lg border border-outline-variant bg-surface-container p-[9px] text-on-surface-muted transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          {errors.items ? (
            <p className="mt-1 text-xs text-error">{errors.items}</p>
          ) : null}

          <div className="mt-2.5 flex items-center justify-end gap-2 text-xs">
            <span className="text-on-surface-muted">Total:</span>
            <span className="font-mono font-bold text-on-background">
              {formatCurrency(liveTotal)}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Notes
          </label>
          <textarea
            value={values.notes}
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
}: {
  quotation: Quotation;
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
  const isEditable =
    quotation.status === "DRAFT" || quotation.status === "PENDING_APPROVAL";
  const isConvertible =
    quotation.status === "PENDING_APPROVAL" || quotation.status === "APPROVED";
  const isRejectable = quotation.status === "PENDING_APPROVAL" && canReject;
  const isRevisable = quotation.status === "REJECTED";

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

      {/* Line Items Table */}
      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="py-2 text-left font-semibold uppercase tracking-[0.06em] text-[11px] text-on-surface-muted">
                  Item
                </th>
                <th className="py-2 text-right font-semibold uppercase tracking-[0.06em] text-[11px] text-on-surface-muted">
                  Qty
                </th>
                <th className="py-2 text-right font-semibold uppercase tracking-[0.06em] text-[11px] text-on-surface-muted">
                  Unit Price
                </th>
                <th className="py-2 text-right font-semibold uppercase tracking-[0.06em] text-[11px] text-on-surface-muted">
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
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-semibold text-on-background transition hover:bg-surface-container-high disabled:opacity-60"
              >
                <RefreshCcw
                  size={13}
                  className={isRevising ? "animate-spin" : ""}
                />
                {isRevising ? "Revising..." : "Revise Quotation"}
              </button>
            ) : null}

            {/* Direct Approve Action: Visible on PENDING_APPROVAL for Admin/Sales Manager */}
            {canApprove && quotation.status === "PENDING_APPROVAL" ? (
              <button
                type="button"
                onClick={() => onApprove(quotation)}
                disabled={isApproving}
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
            {canApprove && isConvertible ? (
              <button
                type="button"
                onClick={() => onConvert(quotation)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition hover:bg-primary-hover shadow-xs"
              >
                <FolderKanban size={13} />
                Convert to Project
              </button>
            ) : null}

            {/* Link to converted project if CONVERTED */}
            {quotation.status === "CONVERTED" && quotation.projectId ? (
              <Link
                href={`/dashboard/projects/${quotation.projectId}`}
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

export default function QuotationsDashboardClient() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [activeTab, setActiveTab] = useState<QuotationFilterTab>("ALL");
  const [quotationsState, setQuotationsState] = useState<QuotationsState>({
    kind: "loading",
  });
  const [formValues, setFormValues] = useState<QuotationFormValues>(
    createQuotationFormValues(),
  );
  const [formErrors, setFormErrors] = useState<QuotationFormErrors>({});
  const [feedback, setFeedback] = useState<QuotationFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiUnavailableMessage, setApiUnavailableMessage] = useState<
    string | null
  >(null);

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

  const replaceQuotationInState = (updated: Quotation) => {
    setQuotationsState((current) => {
      if (current.kind !== "ready" && current.kind !== "unavailable") {
        return { kind: "ready", quotations: [updated] };
      }

      return {
        ...current,
        quotations: current.quotations.map((quotation) =>
          quotation.id === updated.id ? updated : quotation,
        ),
      };
    });
  };

  // Fetch real quotations on page load or status filter tab changes asynchronously
  const fetchQuotationsData = useCallback(async (tab: QuotationFilterTab) => {
    try {
      const res = await listQuotations({ status: tab });
      const items = normalizeQuotations(res);
      if (items.length === 0) {
        return { kind: "empty" as const };
      }
      return { kind: "ready" as const, quotations: items };
    } catch (error) {
      if (isQuotationUnavailableError(error)) {
        const previewItems =
          tab === "ALL"
            ? quotationPreviewList
            : quotationPreviewList.filter((q) => q.status === tab);

        return {
          kind: "unavailable" as const,
          quotations: previewItems,
          message:
            "Quotation APIs are not available yet. Showing prototype preview data until backend endpoints are connected.",
        };
      }
      return {
        kind: "error" as const,
        message: "Failed to load quotations from server.",
      };
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      const nextState = await fetchQuotationsData(activeTab);
      if (active) {
        setQuotationsState(nextState);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [activeTab, fetchQuotationsData]);

  const loadQuotations = async () => {
    setQuotationsState({ kind: "loading" });
    const nextState = await fetchQuotationsData(activeTab);
    setQuotationsState(nextState);
  };

  const handleTabChange = (tabId: QuotationFilterTab) => {
    setActiveTab(tabId);
    setQuotationsState({ kind: "loading" });
  };

  const quotations =
    quotationsState.kind === "ready" || quotationsState.kind === "unavailable"
      ? quotationsState.quotations
      : [];

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
    if (quotation.pdfUrl) {
      window.open(quotation.pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setPdfLoadingId(quotation.id);
    try {
      const res = await getQuotationPdf(quotation.id);
      const pdfUrl = res.pdfUrl;
      if (pdfUrl) {
        replaceQuotationInState({ ...quotation, pdfUrl });
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("No PDF URL returned");
      }
    } catch {
      setFeedback({
        tone: "error",
        message: "Failed to generate quotation PDF. Please try again.",
      });
    } finally {
      setPdfLoadingId(null);
    }
  };

  // Revise handler: moves REJECTED -> DRAFT
  const handleReviseQuotation = async (quotation: Quotation) => {
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
      setRevisingId(null);
    }
  };

  // Direct Approve handler: moves PENDING_APPROVAL -> APPROVED
  const handleApproveQuotation = async (quotation: Quotation) => {
    setApprovingId(quotation.id);
    setFeedback(null);
    try {
      const res = await approveQuotation(quotation.id);
      const updated = "quotation" in res ? res.quotation : (res as Quotation);
      replaceQuotationInState({ ...updated, status: "APPROVED" });
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
      setApprovingId(null);
    }
  };

  // Create Quotation form submission
  const handleSubmit = async () => {
    const validationErrors = validateQuotationForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setFeedback({
        tone: "error",
        message: "Please correct the highlighted quotation form errors.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setApiUnavailableMessage(null);

    try {
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
        const existing =
          current.kind === "ready" || current.kind === "unavailable"
            ? current.quotations
            : [];

        return { kind: "ready", quotations: [createdQuotation, ...existing] };
      });
      setFormValues(createQuotationFormValues());
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
      } else if (isQuotationUnavailableError(error)) {
        setQuotationsState({
          kind: "unavailable",
          quotations: quotationPreviewList,
          message:
            "Quotation APIs are not available yet. Showing prototype preview data until backend endpoints are connected.",
        });
        setApiUnavailableMessage(
          "Quotation endpoint is not available yet. You can continue verifying the form and validation flow until backend support is connected.",
        );
        setFeedback({
          tone: "info",
          message:
            "Quotation API is unavailable right now. Submission has been kept as a clear placeholder state.",
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Feedback Banner */}
      {quotationsState.kind === "unavailable" ? (
        <QuotationFeedbackBanner
          feedback={{ tone: "info", message: quotationsState.message }}
        />
      ) : null}
      {feedback ? <QuotationFeedbackBanner feedback={feedback} /> : null}

      {/* Main Grid: Quotations List + Create Quotation Form */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column: Filter Tabs & Cards */}
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

          {/* Cards or Empty/Loading State */}
          {quotationsState.kind === "loading" ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-level-1">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="mt-3 text-sm font-medium text-on-surface-muted">
                Loading quotations...
              </p>
            </div>
          ) : quotationsState.kind === "error" ? (
            <QuotationStateCard
              title="Failed to Load Quotations"
              message={quotationsState.message}
              onRetry={loadQuotations}
            />
          ) : quotations.length === 0 ? (
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
          ) : (
            quotations.map((quotation) => (
              <QuotationCard
                key={quotation.id}
                quotation={quotation}
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
            ))
          )}
        </div>

        {/* Right Column: Create Quotation Form */}
        <div>
          {canCreateQuotation(user?.role) ? (
            <QuotationForm
              values={formValues}
              errors={formErrors}
              isSubmitting={isSubmitting}
              unavailableMessage={apiUnavailableMessage}
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
          onSuccess={({ quotation: updated, projectId, projectStatus }) => {
            replaceQuotationInState(updated);
            setFeedback({
              tone: "success",
              message: `Project created successfully (ID: ${projectId}). Status: ${projectStatus ?? "ACTIVE"}`,
            });
          }}
          onAlreadyConverted={(q) => {
            replaceQuotationInState({ ...q, status: "CONVERTED" });
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
