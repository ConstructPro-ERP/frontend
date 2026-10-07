"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Loader2, X } from "lucide-react";
import apiClient from "@/lib/axios";
import type { Quotation } from "@/types/quotation";
import { getQuotationErrorMessage } from "@/components/dashboard/quotations/quotationUtils";

interface RejectQuotationModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Quotation) => void;
}

export default function RejectQuotationModal({
  quotation,
  isOpen,
  onClose,
  onSuccess,
}: RejectQuotationModalProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const trimmedReason = reason.trim();
  const isReasonTooShort = trimmedReason.length < 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setApiError(null);

    if (isReasonTooShort) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.patch<Quotation>(
        `/quotations/${quotation.id}/reject`,
        { reason: trimmedReason },
      );
      onSuccess(res.data);
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
      aria-labelledby="reject-quotation-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error-container text-error">
              <Ban size={18} />
            </div>
            <div>
              <h3
                id="reject-quotation-modal-title"
                className="text-base font-bold text-on-background"
              >
                Reject Quotation
              </h3>
              <p className="text-xs text-on-surface-muted">
                Quotation{" "}
                <span className="font-mono text-on-background">
                  {quotation.id}
                </span>
              </p>
            </div>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-50 p-3.5 text-xs text-amber-900">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-amber-600"
            />
            <p>
              Rejecting this quotation will mark its status as{" "}
              <strong className="font-semibold">REJECTED</strong>. The sales
              team can subsequently revise the quotation to re-open it as a
              Draft.
            </p>
          </div>

          {apiError ? (
            <div className="rounded-xl border border-error/20 bg-error-container p-3 text-xs text-on-error-container">
              {apiError}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="rejection-reason-input"
                className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
              >
                Reason for Rejection <span className="text-error">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  trimmedReason.length < 5
                    ? "text-error font-medium"
                    : "text-on-surface-muted"
                }`}
              >
                {trimmedReason.length}/5 min characters
              </span>
            </div>
            <textarea
              id="rejection-reason-input"
              rows={4}
              value={reason}
              disabled={isSubmitting}
              onBlur={() => setTouched(true)}
              onChange={(e) => {
                setReason(e.target.value);
                setApiError(null);
              }}
              placeholder="e.g. Quotation exceeds customer budget limit by 15%."
              className={`w-full rounded-lg border p-3 text-xs text-on-background outline-none transition focus:border-error ${
                touched && isReasonTooShort
                  ? "border-error bg-error-container/30"
                  : "border-outline-variant bg-surface-container"
              }`}
            />
            {touched && isReasonTooShort ? (
              <p className="text-xs font-medium text-error">
                Rejection reason must be at least 5 characters long.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-outline-variant pt-4 mt-2">
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
              disabled={isReasonTooShort || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-error px-4 py-2 text-xs font-semibold text-on-error hover:bg-error-hover transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <Ban size={14} />
                  Reject Quotation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
