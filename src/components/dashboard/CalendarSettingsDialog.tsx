"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  CalendarDays,
  Check,
  ExternalLink,
  Link2,
  Unlink,
  X,
} from "lucide-react";
import type { RootState } from "@/store";
import {
  beginCalendarConnection,
  disconnectCalendar,
  getCalendarConnectionStatus,
  type CalendarConnectionStatus,
} from "@/services/calendarApi";

type Feedback = {
  kind: "success" | "error";
  message: string;
};

function errorMessage(error: unknown) {
  if (
    error instanceof Error &&
    "statusCode" in error &&
    error.statusCode === 502
  ) {
    return "Calendar service is unavailable. Please try again later or contact your administrator.";
  }
  return error instanceof Error
    ? error.message
    : "Calendar settings could not be updated. Please try again.";
}

function formatConnectedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type CalendarSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function CalendarSettingsDialog({
  open,
  onClose,
}: CalendarSettingsDialogProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useSelector(
    (state: RootState) => state.auth,
  );
  const [status, setStatus] = useState<CalendarConnectionStatus | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [action, setAction] = useState<"connect" | "disconnect" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const statusRequestRef = useRef<Promise<void> | null>(null);

  const loadStatus = useCallback(async () => {
    if (statusRequestRef.current) return statusRequestRef.current;

    setIsStatusLoading(true);
    const request = (async () => {
      try {
        setStatus(await getCalendarConnectionStatus());
      } catch (error) {
        setStatus(null);
        setFeedback({ kind: "error", message: errorMessage(error) });
      } finally {
        setIsStatusLoading(false);
        statusRequestRef.current = null;
      }
    })();
    statusRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    if (!open || isAuthLoading || !isAuthenticated) return;
    queueMicrotask(() => void loadStatus());
  }, [open, isAuthLoading, isAuthenticated, loadStatus]);

  useEffect(() => {
    if (!open) return;
    const result = new URLSearchParams(window.location.search).get("calendar");
    if (result === "connected") {
      queueMicrotask(() =>
        setFeedback({
          kind: "success",
          message: "Google Calendar connected successfully.",
        }),
      );
    } else if (result === "error") {
      queueMicrotask(() =>
        setFeedback({
          kind: "error",
          message:
            "Google Calendar could not be connected. Please try again and approve the requested access.",
        }),
      );
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleConnect = async () => {
    setAction("connect");
    setFeedback(null);
    try {
      const authorizationUrl = await beginCalendarConnection();
      if (!authorizationUrl) {
        throw new Error("Google did not return an authorization link.");
      }
      window.location.assign(authorizationUrl);
    } catch (error) {
      setFeedback({ kind: "error", message: errorMessage(error) });
      setAction(null);
    }
  };

  const handleDisconnect = async () => {
    setAction("disconnect");
    setFeedback(null);
    try {
      await disconnectCalendar();
      setStatus({ connected: false, calendarId: null, connectedAt: null });
      setFeedback({
        kind: "success",
        message: "Google Calendar has been disconnected.",
      });
    } catch (error) {
      setFeedback({ kind: "error", message: errorMessage(error) });
    } finally {
      setAction(null);
    }
  };

  if (!open) return null;

  const connectedAt = formatConnectedAt(status?.connectedAt ?? null);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-settings-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-level-2"
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Settings
            </p>
            <h2
              id="calendar-settings-title"
              className="mt-1 text-xl font-bold tracking-tight text-on-background"
            >
              Integrations
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-on-background"
          >
            <X size={18} />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          {feedback ? (
            <div
              role={feedback.kind === "error" ? "alert" : "status"}
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                feedback.kind === "error"
                  ? "border-error-outline bg-error-container text-on-error-container"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <CalendarDays size={22} aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-on-background">
                    Google Calendar
                  </h3>
                  {!isAuthLoading &&
                  isAuthenticated &&
                  !isStatusLoading &&
                  status ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        status?.connected
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {status?.connected ? <Check size={13} /> : null}
                      {status?.connected ? "Connected" : "Not connected"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  Connect your Google account to manage project calendar events.
                </p>

                {status?.connected ? (
                  <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-on-surface-muted">
                        Calendar
                      </dt>
                      <dd className="mt-0.5 font-medium text-on-background">
                        {status.calendarId ?? "Primary calendar"}
                      </dd>
                    </div>
                    {connectedAt ? (
                      <div>
                        <dt className="text-xs font-medium text-on-surface-muted">
                          Connected
                        </dt>
                        <dd className="mt-0.5 font-medium text-on-background">
                          {connectedAt}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:min-w-40">
              {isAuthLoading || (isAuthenticated && isStatusLoading) ? (
                <div
                  role="status"
                  aria-label="Loading calendar settings"
                  className="h-10 w-40 animate-pulse rounded-lg bg-surface-container"
                />
              ) : !isAuthenticated ? (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
                >
                  Sign in to connect
                </Link>
              ) : !status ? (
                <button
                  type="button"
                  onClick={() => void loadStatus()}
                  disabled={isStatusLoading || action !== null}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-background transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Retry status
                </button>
              ) : status.connected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={action !== null}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-background transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Unlink size={15} />
                  {action === "disconnect" ? "Disconnecting…" : "Disconnect"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={action !== null || isStatusLoading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Link2 size={15} />
                  {action === "connect" ? "Connecting…" : "Connect"}
                  <ExternalLink size={13} />
                </button>
              )}
              {isAuthenticated && status && !isStatusLoading ? (
                <button
                  type="button"
                  onClick={() => void loadStatus()}
                  disabled={action !== null}
                  className="text-xs font-medium text-on-surface-muted underline underline-offset-2 hover:text-primary disabled:opacity-50"
                >
                  Refresh status
                </button>
              ) : null}
            </div>
          </div>

          <p className="mt-5 border-t border-outline-variant pt-4 text-xs leading-5 text-on-surface-variant">
            You can disconnect at any time. Existing events remain in Google
            Calendar.
          </p>
        </div>
      </section>
    </div>
  );
}
