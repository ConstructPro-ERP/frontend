"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import apiClient from "@/lib/axios";
import type {
  Quotation,
  QuotationItemInput,
  UpdateQuotationInput,
} from "@/types/quotation";
import {
  calculateLineItemAmount,
  calculateTotalAmount,
  formatCurrency,
  getQuotationErrorMessage,
} from "@/components/dashboard/quotations/quotationUtils";

interface EditQuotationModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Quotation) => void;
}

export default function EditQuotationModal({
  quotation,
  isOpen,
  onClose,
  onSuccess,
}: EditQuotationModalProps) {
  const isLocked =
    quotation.status === "APPROVED" || quotation.status === "CONVERTED";

  const [notes, setNotes] = useState<string>(quotation.notes ?? "");
  const [items, setItems] = useState<QuotationItemInput[]>(() =>
    quotation.items.length > 0
      ? quotation.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      : [{ itemName: "", quantity: 1, unitPrice: 0 }],
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const liveTotal = calculateTotalAmount(items);

  const handleItemChange = (
    index: number,
    field: keyof QuotationItemInput,
    rawVal: string,
  ) => {
    setValidationError(null);
    setApiError(null);
    setItems((current) =>
      current.map((item, i) => {
        if (i !== index) return item;
        if (field === "itemName") {
          return { ...item, itemName: rawVal };
        }
        const parsed = Number(rawVal);
        return { ...item, [field]: Number.isNaN(parsed) ? 0 : parsed };
      }),
    );
  };

  const handleAddItem = () => {
    setValidationError(null);
    setItems((current) => [
      ...current,
      { itemName: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setValidationError(null);
    setItems((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    if (isLocked) {
      setApiError("Approved or converted quotations cannot be edited.");
      return;
    }

    if (items.length === 0) {
      setValidationError("At least one line item is required.");
      return;
    }

    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      if (!it.itemName.trim()) {
        setValidationError(`Item #${i + 1}: Name cannot be empty.`);
        return;
      }
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
        setValidationError(
          `Item #${i + 1}: Quantity must be greater than zero.`,
        );
        return;
      }
      if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0) {
        setValidationError(
          `Item #${i + 1}: Unit price must be zero or a positive number.`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    const payload: UpdateQuotationInput = {
      notes: notes.trim() || undefined,
      items: items.map((it) => ({
        itemName: it.itemName.trim(),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      })),
    };

    try {
      const res = await apiClient.put<Quotation>(
        `/quotations/${quotation.id}`,
        payload,
      );
      const updated = res.data;
      onSuccess(updated);
      onClose();
    } catch (err) {
      setApiError(getQuotationErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-quotation-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <div>
            <h3
              id="edit-quotation-modal-title"
              className="text-base font-bold text-on-background"
            >
              Edit Quotation
            </h3>
            <p className="mt-0.5 text-xs text-on-surface-muted">
              Quotation{" "}
              <span className="font-mono text-on-background">
                {quotation.id}
              </span>
              {quotation.lead?.customerName ? (
                <> &bull; {quotation.lead.customerName}</>
              ) : (
                <> &bull; Lead {quotation.leadId}</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="rounded-lg p-1.5 text-on-surface-muted hover:bg-surface-container hover:text-on-background transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-y-auto p-6 space-y-5"
        >
          {isLocked ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-error/20 bg-error-container p-3.5 text-xs text-on-error-container">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
              <div>
                <p className="font-semibold text-error">Quotation Locked</p>
                <p className="mt-0.5">
                  This quotation has status <strong>{quotation.status}</strong>{" "}
                  and cannot be edited.
                </p>
              </div>
            </div>
          ) : null}

          {apiError ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-error/20 bg-error-container p-3.5 text-xs text-on-error-container">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
              <span>{apiError}</span>
            </div>
          ) : null}

          {validationError ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0 text-amber-600"
              />
              <span>{validationError}</span>
            </div>
          ) : null}

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Line Items ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isLocked || isSubmitting}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1 text-xs font-medium text-on-background transition hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={13} />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_75px_110px_90px_auto] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-muted">
                <span>Item Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit Price</span>
                <span className="text-right">Line Total</span>
                <span className="w-8"></span>
              </div>

              {items.map((item, idx) => {
                const lineTotal = calculateLineItemAmount(
                  item.quantity,
                  item.unitPrice,
                );
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_75px_110px_90px_auto] items-center gap-2"
                  >
                    <input
                      type="text"
                      value={item.itemName}
                      disabled={isLocked || isSubmitting}
                      onChange={(e) =>
                        handleItemChange(idx, "itemName", e.target.value)
                      }
                      placeholder="e.g. Reinforced Foundation"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-background outline-none focus:border-primary"
                    />
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={item.quantity === 0 ? "" : item.quantity}
                      disabled={isLocked || isSubmitting}
                      onChange={(e) =>
                        handleItemChange(idx, "quantity", e.target.value)
                      }
                      placeholder="Qty"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-2 text-right font-mono text-xs text-on-background outline-none focus:border-primary"
                    />
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitPrice === 0 ? "" : item.unitPrice}
                      disabled={isLocked || isSubmitting}
                      onChange={(e) =>
                        handleItemChange(idx, "unitPrice", e.target.value)
                      }
                      placeholder="Unit Price"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-2 text-right font-mono text-xs text-on-background outline-none focus:border-primary"
                    />
                    <div className="py-2 text-right font-mono text-xs font-semibold text-on-background truncate">
                      {formatCurrency(lineTotal)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1 || isLocked || isSubmitting}
                      aria-label={`Remove line item ${idx + 1}`}
                      className="rounded-lg p-2 text-on-surface-muted hover:bg-error-container hover:text-error transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            <div className="flex justify-end items-center gap-3 border-t border-outline-variant pt-3">
              <span className="text-xs font-medium text-on-surface-muted">
                Calculated Total:
              </span>
              <span className="font-mono text-base font-bold text-on-background">
                {formatCurrency(liveTotal)}
              </span>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Scope & Terms Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              disabled={isLocked || isSubmitting}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add terms, schedule details, or updated notes..."
              className="w-full rounded-lg border border-outline-variant bg-surface-container p-3 text-xs text-on-background outline-none focus:border-primary"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-outline-variant pt-4 mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLocked || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Save Quotation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
