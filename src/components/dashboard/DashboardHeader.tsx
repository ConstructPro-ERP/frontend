"use client";

import { Bell, LoaderCircle, Menu, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useSelector } from "react-redux";
import { dashboardPageConfigs } from "@/components/dashboard/dashboardConfig";
import { formatAnalyticsCompactCurrency } from "@/components/dashboard/analytics/analyticsUtils";
import {
  useDashboardQuery,
  useDashboardSnapshot,
} from "@/hooks/useDashboardQuery";
import { canAccessDashboardPath } from "@/lib/dashboardAccess";
import {
  getDashboardActivity,
  getDashboardSummary,
} from "@/services/dashboardApi";
import type { DashboardActivity } from "@/types/dashboard";
import type { RootState } from "@/store";

type DashboardHeaderProps = {
  onOpenSidebar: () => void;
};

function subscribeClock(listener: () => void) {
  const timer = window.setInterval(listener, 60000);
  return () => window.clearInterval(timer);
}

function clockLabel() {
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 18
        ? "Good afternoon"
        : "Good evening";
  return `${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${greeting}`;
}

function getPageConfig(pathname: string) {
  return (
    dashboardPageConfigs[pathname] ?? {
      title: "Dashboard",
      description: "Shared ConstructPro workspace.",
      breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }],
    }
  );
}

export default function DashboardHeader({
  onOpenSidebar,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const pageConfig = getPageConfig(pathname);
  const user = useSelector((state: RootState) => state.auth.user);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardActivity[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );
  const notificationsRef = useRef<HTMLDivElement>(null);
  const dateLabel = useSyncExternalStore(
    subscribeClock,
    clockLabel,
    () => "Welcome",
  );

  // Prefer the authenticated user's first name for a natural greeting.
  // Fall back to another available identity instead of a hardcoded role.
  const displayName =
    user?.firstName?.trim() || user?.lastName?.trim() || user?.email || null;

  const isFinancePage = pathname === "/dashboard/finance";
  const isAnalyticsPage = pathname === "/dashboard/analytics";

  const canViewFinance =
    Boolean(user) && canAccessDashboardPath(user?.role, pathname);

  // Reuse the existing user-scoped dashboard summary cache.
  const financeSummaryQuery = useDashboardQuery(
    "home:summary",
    getDashboardSummary,
    isFinancePage && canViewFinance,
  );

  const latestAnalysis = useDashboardSnapshot<string>("analytics:latest-run");

  // Only designated pages use the personalized greeting.
  // Other pages continue displaying their configured description.
  let subtitle = pageConfig.useGreeting
    ? `${dateLabel}${displayName ? `, ${displayName}` : ""}`
    : (pageConfig.description ?? "");

  if (isFinancePage && canViewFinance) {
    const summary = financeSummaryQuery.data;

    if (summary) {
      const outstanding = formatAnalyticsCompactCurrency(
        summary.revenue.outstandingBalance,
      );
      const overdueCount = summary.invoices.overdueCount;

      subtitle =
        `${outstanding} outstanding · ` +
        `${overdueCount} overdue ` +
        `${overdueCount === 1 ? "invoice" : "invoices"}`;

      if (financeSummaryQuery.error) {
        subtitle += " · Data may be outdated";
      }
    } else if (financeSummaryQuery.error) {
      subtitle = "Finance figures are temporarily unavailable";
    } else {
      subtitle = "Loading finance summary…";
    }
  }

  if (isAnalyticsPage) {
    const generatedAt = latestAnalysis.data;

    if (generatedAt && Number.isFinite(Date.parse(generatedAt))) {
      const analysedAt = new Intl.DateTimeFormat("en-LK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(generatedAt));

      subtitle = `AI risk insights · Last analysed ${analysedAt}`;
    }
  }

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const response = await getDashboardActivity(1);
      setNotifications(response.items);
    } catch {
      setNotificationsError("Notifications could not be loaded.");
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !notificationsRef.current?.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          aria-label="Open sidebar"
          className="rounded-lg border border-outline-variant bg-surface-container p-2 text-on-surface-variant transition hover:bg-surface-container-high lg:hidden"
          onClick={onOpenSidebar}
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-bold tracking-[-0.3px] text-on-background">
              {pageConfig.title}
            </h1>
            <p className="mt-0.5 text-xs text-on-surface-muted">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              aria-label="Recent activity"
              aria-expanded={notificationsOpen}
              aria-controls="dashboard-notifications"
              onClick={() => {
                const shouldOpen = !notificationsOpen;
                setNotificationsOpen(shouldOpen);
                if (shouldOpen) void loadNotifications();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-background"
            >
              <Bell size={16} />
            </button>

            {notificationsOpen ? (
              <section
                id="dashboard-notifications"
                aria-label="Recent activity notifications"
                className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-3"
              >
                <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-on-background">
                      Recent activity
                    </h2>
                    <p className="mt-0.5 text-xs text-on-surface-muted">
                      Latest events across modules
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void loadNotifications()}
                      disabled={notificationsLoading}
                      className="rounded-md p-2 text-on-surface-muted hover:bg-surface-container hover:text-primary disabled:opacity-50"
                      aria-label="Refresh notifications"
                    >
                      {notificationsLoading ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={15} />
                      )}
                    </button>
                  </div>
                </div>

                {notificationsLoading && notifications.length === 0 ? (
                  <p
                    role="status"
                    className="px-4 py-8 text-center text-sm text-on-surface-muted"
                  >
                    Loading recent activity…
                  </p>
                ) : notificationsError ? (
                  <div className="px-4 py-6 text-center">
                    <p role="alert" className="text-sm text-error">
                      {notificationsError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadNotifications()}
                      className="mt-3 text-sm font-semibold text-primary hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-on-surface-muted">
                    No recent activity yet.
                  </p>
                ) : (
                  <ul className="max-h-[min(65vh,28rem)] overflow-y-auto">
                    {notifications.map((activity, index) => (
                      <li
                        key={`${activity.type}-${activity.entityId}-${activity.occurredAt}-${index}`}
                        className="border-b border-outline-variant last:border-b-0"
                      >
                        <div className="flex w-full gap-3 px-4 py-3 text-left">
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-on-background">
                              {activity.title}
                            </span>
                            <span className="mt-0.5 block text-xs leading-5 text-on-surface-variant">
                              {activity.description}
                            </span>
                            <time
                              className="mt-1 block text-[11px] text-on-surface-muted"
                              dateTime={activity.occurredAt}
                            >
                              {new Intl.DateTimeFormat(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(activity.occurredAt))}
                            </time>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
