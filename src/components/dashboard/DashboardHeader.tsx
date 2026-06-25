"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import { dashboardPageConfigs } from "@/components/dashboard/dashboardConfig";

type DashboardHeaderProps = {
  onOpenSidebar: () => void;
};

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
              {pageConfig.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden h-9 w-[220px] items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 sm:flex">
            <Search size={14} className="text-on-surface-muted" />
            <input
              type="text"
              placeholder="Search anything..."
              aria-label="Search anything"
              className="w-full bg-transparent text-[13px] text-on-background outline-none placeholder:text-on-surface-muted"
            />
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-background"
          >
            <Bell size={16} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-surface-container-lowest bg-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
