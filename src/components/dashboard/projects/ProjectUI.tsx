"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { X, FolderKanban } from "lucide-react";
import { ApiError } from "@/lib/ApiError";

const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45";
export const buttonClass =
  buttonBaseClass +
  " border-outline-variant enabled:hover:bg-surface-container";
export const primaryClass =
  buttonBaseClass +
  " cursor-pointer border-transparent bg-primary text-on-primary enabled:hover:bg-primary-hover enabled:active:bg-primary-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const createProjectClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition duration-200 enabled:hover:bg-primary-hover enabled:hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:translate-y-0 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-45";
export const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
export const panelClass =
  "rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-1";
export const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const money = (value?: number | string | null) =>
  value == null
    ? "Not set"
    : new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
      }).format(Number(value));
export const date = (value?: string | null) =>
  !value
    ? "Not set"
    : !Number.isFinite(Date.parse(value))
      ? "Invalid date"
      : new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(value));
export function errorMessage(error: unknown) {
  if (error instanceof ApiError && error.code === "PROJECT_NOT_FOUND")
    return error.message;
  if (error instanceof ApiError && [404, 501, 503].includes(error.statusCode))
    return "This feature is currently unavailable. Please try again later.";
  return error instanceof Error
    ? error.message
    : "Unable to complete this request. Please try again.";
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-lg border p-3 text-sm ${error ? "border-error/20 bg-error-container text-on-error-container" : "border-primary/20 bg-primary-soft text-on-background"}`}
    >
      {children}
    </div>
  );
}
export function Badge({ status }: { status: string }) {
  const tone = ["ACTIVE", "COMPLETED"].includes(status)
    ? "bg-risk-low-container text-risk-low"
    : ["CANCELLED", "BLOCKED"].includes(status)
      ? "bg-error-container text-error"
      : status === "ON_HOLD"
        ? "bg-risk-medium-container text-on-surface"
        : "bg-primary-soft text-primary";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {label(status)}
    </span>
  );
}
export function Progress({
  value,
  ariaLabel = "Weighted project progress",
}: {
  value?: number | null;
  ariaLabel?: string;
}) {
  if (value == null || !Number.isFinite(value))
    return <span className="text-xs text-on-surface-muted">Not available</span>;
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div className="flex min-w-28 items-center gap-3">
      <progress
        aria-label={ariaLabel}
        value={percent}
        max={100}
        className="h-2 w-24 accent-primary"
      />
      <span className="text-xs font-semibold">{percent.toFixed(1)}%</span>
    </div>
  );
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-10 text-center">
      <FolderKanban className="mx-auto mb-3 text-primary" size={30} />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-on-surface-muted">{description}</p>
    </div>
  );
}
export function Pager({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant p-4">
      <span className="text-xs text-on-surface-muted">
        {total} records · Page {page} of {Math.max(1, totalPages)}
      </span>
      <div className="flex gap-2">
        <button
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>
        <button
          className={buttonClass}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-outline-variant bg-surface-container-lowest p-0 text-on-background shadow-2xl backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-outline-variant p-5">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <button
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
          className={buttonClass}
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export interface Field {
  name: string;
  label: string;
  type?: "text" | "date" | "number" | "textarea" | "select";
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}
export function Editor({
  title,
  fields,
  initial = {},
  onSave,
  onClose,
  validate,
  description,
  submitLabel = "Save changes",
  submitClassName = primaryClass,
  submitDisabled = false,
}: {
  title: string;
  fields: Field[];
  initial?: Record<string, string>;
  onSave: (values: Record<string, string>) => Promise<void>;
  onClose: () => void;
  validate?: (values: Record<string, string>) => string | null;
  description?: string;
  submitLabel?: string;
  submitClassName?: string;
  submitDisabled?: boolean;
}) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const id = useId();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving.current || submitDisabled) return;
    const message = validate?.(values);
    if (message) {
      setError(message);
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-4 p-5">
        {description && (
          <p className="text-sm text-on-surface-muted">{description}</p>
        )}
        {error && <Notice error>{error}</Notice>}
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <label
              key={field.name}
              className={field.type === "textarea" ? "sm:col-span-2" : ""}
            >
              <span className="mb-1.5 block text-xs font-semibold">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              {field.type === "select" ? (
                <select
                  className={inputClass}
                  required={field.required}
                  disabled={field.disabled}
                  value={values[field.name] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [field.name]: e.target.value })
                  }
                  aria-describedby={field.hint ? id + field.name : undefined}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  className={inputClass}
                  rows={3}
                  maxLength={field.maxLength}
                  disabled={field.disabled}
                  aria-describedby={field.hint ? id + field.name : undefined}
                  value={values[field.name] ?? ""}
                  required={field.required}
                  onChange={(e) =>
                    setValues({ ...values, [field.name]: e.target.value })
                  }
                />
              ) : (
                <input
                  className={inputClass}
                  type={field.type ?? "text"}
                  maxLength={field.maxLength}
                  disabled={field.disabled}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={values[field.name] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [field.name]: e.target.value })
                  }
                  aria-describedby={field.hint ? id + field.name : undefined}
                />
              )}
              {field.hint && (
                <span
                  id={id + field.name}
                  className="mt-1 block text-xs text-on-surface-muted"
                >
                  {field.hint}
                </span>
              )}
            </label>
          ))}
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={buttonClass}
          >
            Cancel
          </button>
          <button disabled={busy || submitDisabled} className={submitClassName}>
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
