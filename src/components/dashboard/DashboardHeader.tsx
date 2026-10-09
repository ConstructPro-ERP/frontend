"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { dashboardPageConfigs } from "@/components/dashboard/dashboardConfig";

type DashboardHeaderProps = {
  onOpenSidebar: () => void;
  homeTheme?: string;
  onToggleTheme?: () => void;
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
      searchPlaceholder: "Search anything...",
    }
  );
}

export default function DashboardHeader({
  onOpenSidebar,
  homeTheme,
  onToggleTheme,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const pageConfig = getPageConfig(pathname);
  const user = useSelector((state: RootState) => state.auth.user);
  const dateLabel = useSyncExternalStore(
    subscribeClock,
    clockLabel,
    () => "Welcome",
  );

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
            <p className="mt-0.5 text-xs text-on-surface-muted">
              {homeTheme
                ? `${dateLabel}${user?.firstName ? `, ${user.firstName}` : ""}`
                : pageConfig.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden h-9 w-[220px] items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 sm:flex">
            <Search size={14} className="text-on-surface-muted" />
            <input
              type="text"
              placeholder={pageConfig.searchPlaceholder ?? "Search anything..."}
              aria-label={pageConfig.searchPlaceholder ?? "Search anything"}
              disabled={!!homeTheme}
              title={
                homeTheme ? "Global search is not available yet" : undefined
              }
              className="w-full bg-transparent text-[13px] text-on-background outline-none placeholder:text-on-surface-muted"
            />
          </div>

          <button
            type="button"
            aria-label="Notifications"
            disabled={!!homeTheme}
            title={
              homeTheme ? "Notifications are not available yet" : undefined
            }
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-background"
          >
            <Bell size={16} />
            {!homeTheme && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-surface-container-lowest bg-red-500" />
            )}
          </button>
          {homeTheme && (
            <button
              type="button"
              className="home-theme-toggle"
              role="switch"
              aria-checked={homeTheme === "dark"}
              aria-label="Dark theme"
              onClick={onToggleTheme}
            >
              <span aria-hidden="true">{homeTheme === "dark" ? "☾" : "☀"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
