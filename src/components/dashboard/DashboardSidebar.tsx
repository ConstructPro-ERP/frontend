"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, CircleUserRound, LogOut, Settings, X } from "lucide-react";
import { useState } from "react";
import { dashboardNavItems } from "@/components/dashboard/dashboardConfig";

type DashboardSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

function isNavItemActive(currentPath: string, href: string) {
  if (href === "/dashboard") {
    return currentPath === href;
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function DashboardSidebar({
  mobileOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const sections = ["Main", "Finance", "Management"] as const;
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-200 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-outline-variant bg-surface-container-lowest shadow-level-2 transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-[240px] lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Dashboard sidebar"
      >
        <div className="flex h-16 items-center justify-between border-b border-outline-variant px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            onClick={onClose}
          >
            <Image
              src="/logos/IsharaHomesLogo.png"
              alt="ConstructPro logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-on-background">
                ConstructPro
              </span>
              <span className="text-[10px] tracking-[0.04em] text-on-surface-muted">
                ERP Platform
              </span>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container lg:hidden"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto" aria-label="Primary">
          {sections.map((section) => (
            <div key={section} className="px-2.5 pt-4 pb-1">
              <p className="mb-1 px-2 text-[9.5px] font-bold uppercase tracking-[0.18em] text-on-surface-muted">
                {section}
              </p>
              <div>
                {dashboardNavItems
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const Icon = item.icon;
                    const active = isNavItemActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`relative mb-px flex items-center gap-[9px] rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition ${
                          active
                            ? "bg-primary-soft font-semibold text-primary"
                            : "text-on-surface-variant hover:bg-surface-container hover:text-on-background"
                        }`}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                      >
                        {active ? (
                          <span
                            className="absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-[3px] bg-primary"
                            aria-hidden="true"
                          />
                        ) : null}
                        <Icon size={16} className="shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-outline-variant p-2.5">
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-surface-container"
              aria-label="Open account menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-blue-800 text-[11px] font-bold text-white">
                AW
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-on-background">
                  Admin Wickrama
                </div>
                <div className="text-[11px] text-on-surface-muted">
                  Administrator
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-on-surface-muted transition-transform ${
                  accountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountMenuOpen ? (
              <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-level-2">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-background transition hover:bg-surface-container"
                >
                  <CircleUserRound size={16} className="text-on-surface-variant" />
                  Profile
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-background transition hover:bg-surface-container"
                >
                  <Settings size={16} className="text-on-surface-variant" />
                  Settings
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-background transition hover:bg-surface-container"
                >
                  <LogOut size={16} className="text-on-surface-variant" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
