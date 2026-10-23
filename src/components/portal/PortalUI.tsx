"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { PortalQuery } from "@/hooks/usePortalQuery";
import { describePortalError, portalLabel } from "@/lib/portalFormat";

export const portalButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-background transition-colors enabled:hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45";
export const portalLinkClass =
  "font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const portalPanelClass =
  "rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-1";

export function PortalPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={portalPanelClass}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant p-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-on-background">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-on-surface-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function PortalLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 p-10 text-sm text-on-surface-muted"
    >
      <Loader2 className="animate-spin motion-reduce:animate-none" size={18} />
      <span>{label}…</span>
    </div>
  );
}

export function PortalEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-10 text-center">
      <Inbox className="mx-auto mb-3 text-on-surface-muted" size={28} />
      <h3 className="font-semibold text-on-background">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-muted">
        {description}
      </p>
    </div>
  );
}

export function PortalError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const { message, retryable } = describePortalError(error);
  return (
    <div role="alert" className="p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 text-error" size={28} />
      <p className="mx-auto max-w-md text-sm text-on-background">{message}</p>
      {retryable && onRetry ? (
        <button
          type="button"
          className={`${portalButtonClass} mt-4`}
          onClick={onRetry}
        >
          <RefreshCw size={15} />
          Try again
        </button>
      ) : null}
    </div>
  );
}

/** Renders the loading, error, empty or loaded state of a portal query. */
export function PortalQueryBoundary<T>({
  query,
  isEmpty,
  loadingLabel,
  emptyTitle,
  emptyDescription,
  children,
}: {
  query: PortalQuery<T>;
  isEmpty: (data: T) => boolean;
  loadingLabel?: string;
  emptyTitle: string;
  emptyDescription: string;
  children: (data: T) => ReactNode;
}) {
  const { data, error, retry } = query;
  if (data === undefined) {
    if (error) return <PortalError error={error} onRetry={retry} />;
    return <PortalLoading label={loadingLabel} />;
  }
  return (
    <>
      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-error/20 bg-error-container px-4 py-2 text-sm text-on-error-container"
        >
          <span>{describePortalError(error).message}</span>
          {describePortalError(error).retryable ? (
            <button type="button" className={portalLinkClass} onClick={retry}>
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
      {isEmpty(data) ? (
        <PortalEmpty title={emptyTitle} description={emptyDescription} />
      ) : (
        children(data)
      )}
    </>
  );
}

export function PortalStatusBadge({ status }: { status: string }) {
  const tone = ["ACTIVE", "COMPLETED", "APPROVED", "CONVERTED"].includes(status)
    ? "bg-risk-low-container text-risk-low"
    : ["CANCELLED", "REJECTED", "BLOCKED"].includes(status)
      ? "bg-error-container text-error"
      : ["ON_HOLD", "PENDING_APPROVAL"].includes(status)
        ? "bg-risk-medium-container text-on-surface"
        : "bg-primary-soft text-primary";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {portalLabel(status)}
    </span>
  );
}

export function PortalProgress({
  value,
  label,
}: {
  value: number | null | undefined;
  label: string;
}) {
  if (value == null || !Number.isFinite(value))
    return <span className="text-xs text-on-surface-muted">Not available</span>;
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div className="flex min-w-28 items-center gap-3">
      <progress
        aria-label={label}
        value={percent}
        max={100}
        className="h-2 w-24 accent-primary"
      />
      <span className="text-xs font-semibold">{percent.toFixed(0)}%</span>
    </div>
  );
}

export function PortalPager({
  page,
  totalPages,
  total,
  fetching,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  fetching?: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant p-4"
    >
      <p className="text-sm text-on-surface-muted" aria-live="polite">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={portalButtonClass}
          disabled={page <= 1 || fetching}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className={portalButtonClass}
          disabled={page >= totalPages || fetching}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
