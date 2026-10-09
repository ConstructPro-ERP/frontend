"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Info,
  Link as LinkIcon,
  Loader2,
  User,
  X,
} from "lucide-react";
import { convertQuotationToProject } from "@/services/projectConversionApi";
import { ApiError } from "@/lib/ApiError";
import type {
  ConvertToProjectInput,
  Quotation,
} from "@/types/quotation";
import {
  formatCurrency,
  getQuotationErrorMessage,
  isAlreadyConvertedError,
} from "@/components/dashboard/quotations/quotationUtils";

interface ConvertToProjectModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: {
    quotation: Quotation;
    projectId: string;
    projectStatus?: string;
  }) => void;
  onAlreadyConverted: (quotation: Quotation) => void;
}

export default function ConvertToProjectModal({
  quotation,
  isOpen,
  onClose,
  onSuccess,
  onAlreadyConverted,
}: ConvertToProjectModalProps) {
  const [mode, setMode] = useState<"new" | "link">("new");

  // Form fields
  const [projectName, setProjectName] = useState(() =>
    quotation.lead?.customerName
      ? `${quotation.lead.customerName} - Project`
      : `Lead ${quotation.leadId} Project`,
  );
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [budget, setBudget] = useState<number>(quotation.totalAmount);
  const [projectManagerId, setProjectManagerId] = useState("");
  const [targetProjectId, setTargetProjectId] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    let payload: ConvertToProjectInput = {};

    if (mode === "new") {
      if (!projectName.trim()) {
        setValidationError("Project name is required.");
        return;
      }
      if (!startDate) {
        setValidationError("Start date is required.");
        return;
      }
      if (budget <= 0 || Number.isNaN(budget)) {
        setValidationError("Budget must be greater than zero.");
        return;
      }

      // Convert date string to ISO
      let isoDate = startDate;
      try {
        isoDate = new Date(startDate).toISOString();
      } catch {
        isoDate = new Date().toISOString();
      }

      payload = {
        projectName: projectName.trim(),
        startDate: isoDate,
        budget: Number(budget),
        projectManagerId: projectManagerId.trim() || undefined,
      };
    } else {
      if (!targetProjectId.trim()) {
        setValidationError("Target Project ID is required.");
        return;
      }
      payload = {
        targetProjectId: targetProjectId.trim(),
      };
    }

    setIsSubmitting(true);
    try {
      const projResponse = await convertQuotationToProject(quotation.id, payload);

      onSuccess({
        quotation: projResponse.quotation,
        projectId: projResponse.projectId,
        projectStatus: projResponse.projectStatus ?? "ACTIVE",
      });

      onClose();
    } catch (err) {
      if (
        isAlreadyConvertedError(err) ||
        (err instanceof ApiError && err.code === "ALREADY_CONVERTED")
      ) {
        onAlreadyConverted({ ...quotation, status: "CONVERTED" });
        onClose();
      } else {
        setApiError(getQuotationErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="convert-project-modal-title"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <FolderKanban size={18} />
            </div>
            <div>
              <h3
                id="convert-project-modal-title"
                className="text-base font-bold text-on-background"
              >
                Approve & Convert to Project
              </h3>
              <p className="text-xs text-on-surface-muted">
                Quotation{" "}
                <span className="font-mono text-on-background">
                  {quotation.id}
                </span>
                {quotation.lead?.customerName ? (
                  <> &bull; {quotation.lead.customerName}</>
                ) : null}
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

        {/* Summary Info Banner */}
        <div className="bg-primary-soft/60 px-6 py-3 border-b border-primary/10 flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">Approved Total Value:</span>
          <span className="font-mono font-bold text-sm text-primary">
            {formatCurrency(quotation.totalAmount)}
          </span>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-surface-container p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("new");
                setValidationError(null);
              }}
              className={`flex-1 py-1.5 font-medium rounded-md transition ${
                mode === "new"
                  ? "bg-surface-container-lowest text-on-background shadow-xs font-semibold"
                  : "text-on-surface-muted hover:text-on-background"
              }`}
            >
              Create New Project
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("link");
                setValidationError(null);
              }}
              className={`flex-1 py-1.5 font-medium rounded-md transition ${
                mode === "link"
                  ? "bg-surface-container-lowest text-on-background shadow-xs font-semibold"
                  : "text-on-surface-muted hover:text-on-background"
              }`}
            >
              Link to Existing Project
            </button>
          </div>

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

          {mode === "new" ? (
            <div className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Project Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="e.g. Lotus Villa Residential Phase 1"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-background outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <Calendar size={13} />
                    Start Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-background outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Initial Budget (LKR) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={budget}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      setBudget(Number(e.target.value));
                      setValidationError(null);
                    }}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 font-mono text-xs text-on-background outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <User size={13} />
                  Project Manager ID (Optional)
                </label>
                <input
                  type="text"
                  value={projectManagerId}
                  disabled={isSubmitting}
                  onChange={(e) => setProjectManagerId(e.target.value)}
                  placeholder="e.g. user-uuid or project manager ID"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-background outline-none focus:border-primary"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-soft p-3 text-xs text-on-surface-variant">
                <Info size={15} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  Linking to an existing project associates this approved
                  quotation with that project without creating a new duplicate
                  project entity.
                </span>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <LinkIcon size={13} />
                  Target Project ID <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={targetProjectId}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setTargetProjectId(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="e.g. proj-2026-009 or UUID"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-background outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Approve & Convert
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
