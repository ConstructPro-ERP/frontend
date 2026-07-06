"use client";

import { useState } from "react";
import { Check, FileText, Plus, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import apiClient from "@/lib/axios";
import { ApiError } from "@/lib/ApiError";
import type {
  Quotation,
  QuotationFormErrors,
  QuotationFormValues,
  QuotationItemInput,
} from "@/types/quotation";
import {
  canCreateQuotation,
  createQuotationFormValues,
  formatCurrency,
  formatDate,
  isQuotationUnavailableError,
  quotationPreviewList,
  validateQuotationForm,
} from "@/components/dashboard/quotations/quotationUtils";

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

function getQuotationStatusBadgeClasses(status: Quotation["status"]) {
  switch (status) {
    case "APPROVED":
      return "bg-risk-low-container text-risk-low";
    case "CONVERTED":
      return "bg-primary-soft text-primary";
    case "REJECTED":
      return "bg-error-container text-error";
    case "PENDING_APPROVAL":
      return "bg-risk-medium-container text-risk-medium";
    case "DRAFT":
    default:
      return "bg-surface-container text-on-surface-muted";
  }
}

function getQuotationStatusLabel(status: Quotation["status"]) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending Approval";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "CONVERTED":
      return "Converted";
    case "DRAFT":
    default:
      return "Draft";
  }
}

function QuotationStatusBadge({ status }: { status: Quotation["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[11px] font-semibold ${getQuotationStatusBadgeClasses(status)}`}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-current" />
      {getQuotationStatusLabel(status)}
    </span>
  );
}

function QuotationStateCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-outline bg-surface-container-lowest p-8 text-center shadow-level-1">
      <h2 className="text-lg font-semibold text-on-background">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
        {message}
      </p>
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
      className={`rounded-xl border px-4 py-3 text-sm ${toneClasses}`}
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
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-on-surface-variant">
            Lead ID
          </label>
          <input
            type="text"
            value={values.leadId}
            onChange={(event) => onFieldChange("leadId", event.target.value)}
            placeholder="lead-2026-108"
            className={`w-full rounded-lg border px-3 py-[9px] text-[13px] text-on-background outline-none ${
              errors.leadId
                ? "border-error bg-error-container"
                : "border-outline-variant bg-surface-container"
            }`}
          />
          {errors.leadId ? (
            <p className="mt-1 text-xs text-error">{errors.leadId}</p>
          ) : null}
        </div>

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
            {values.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_70px_100px_auto] items-start gap-2"
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
                  value={item.quantity}
                  onChange={(event) =>
                    onItemChange(index, "quantity", event.target.value)
                  }
                  placeholder="Qty"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-[9px] font-mono text-[13px] text-on-background outline-none"
                />
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(event) =>
                    onItemChange(index, "unitPrice", event.target.value)
                  }
                  placeholder="Unit price"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-[9px] font-mono text-[13px] text-on-background outline-none"
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
            ))}
          </div>
          {errors.items ? (
            <p className="mt-1 text-xs text-error">{errors.items}</p>
          ) : null}
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
  onViewPdf,
}: {
  quotation: Quotation;
  onViewPdf: (quotation: Quotation) => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-1">
      <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <div>
          <p className="text-[13px] font-semibold text-on-background">
            Lead {quotation.leadId}
          </p>
          <p className="text-[11px] text-on-surface-muted">
            {formatDate(quotation.quotationDate)}
          </p>
        </div>
        <QuotationStatusBadge status={quotation.status} />
      </div>
      <div className="p-5">
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
                <td className="py-[9px] text-on-background">{item.itemName}</td>
                <td className="py-[9px] text-right font-mono text-on-background">
                  {item.quantity}
                </td>
                <td className="py-[9px] text-right font-mono text-on-background">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-[9px] text-right font-mono text-on-background">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[13px] font-bold text-on-background">
            Total: {formatCurrency(quotation.totalAmount)}
          </p>
          <button
            type="button"
            onClick={() => onViewPdf(quotation)}
            disabled={!quotation.pdfUrl}
            className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-background transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText size={13} />
            {quotation.pdfUrl ? "View PDF" : "Preparing PDF..."}
          </button>
        </div>
        {quotation.notes ? (
          <p className="mt-3 text-[11.5px] text-on-surface-muted">
            {quotation.notes}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function QuotationsDashboardClient() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [quotationsState, setQuotationsState] = useState<QuotationsState>({
    kind: "empty",
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

        return { ...item, [field]: Number(value) };
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

  const handleViewPdf = (quotation: Quotation) => {
    if (!quotation.pdfUrl) {
      return;
    }

    window.open(quotation.pdfUrl, "_blank", "noopener,noreferrer");
  };

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
      const createResponse = await apiClient.post<Quotation>("/quotations", {
        leadId: formValues.leadId,
        notes: formValues.notes || undefined,
        items: formValues.items,
      });

      let createdQuotation = createResponse.data;

      try {
        const refreshedResponse = await apiClient.get<Quotation>(
          `/quotations/${createdQuotation.id}`,
        );
        createdQuotation = refreshedResponse.data;
      } catch {
        // Read-path confirmation is best-effort; keep the created quotation as-is.
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
      {quotationsState.kind === "unavailable" ? (
        <QuotationFeedbackBanner
          feedback={{ tone: "info", message: quotationsState.message }}
        />
      ) : null}
      {feedback ? <QuotationFeedbackBanner feedback={feedback} /> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          {quotations.length === 0 ? (
            <QuotationStateCard
              title="No quotations created in this session yet"
              message="No quotations created in this session yet - generate one below."
            />
          ) : (
            quotations.map((quotation) => (
              <QuotationCard
                key={quotation.id}
                quotation={quotation}
                onViewPdf={handleViewPdf}
              />
            ))
          )}
        </div>

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
              message="Only Admin or Manager roles can generate quotations."
            />
          )}
        </div>
      </section>
    </div>
  );
}
