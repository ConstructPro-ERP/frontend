"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { canAccessDashboardPath } from "@/lib/dashboardAccess";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./home-shell.css";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardLoadingProgress from "@/components/dashboard/DashboardLoadingProgress";
import CalendarSettingsDialog from "@/components/dashboard/CalendarSettingsDialog";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export default function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const isSettingsRoute = pathname === "/settings/integrations";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const allowed =
    isSettingsRoute || canAccessDashboardPath(user?.role, pathname);
  const isHome = pathname === "/dashboard";

  return (
    <div
      className={`flex min-h-screen bg-surface-bg lg:pl-[240px] ${isHome ? `home-dashboard-shell ${dmSans.variable} ${dmMono.variable}` : ""}`}
    >
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <CalendarSettingsDialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          if (isSettingsRoute) router.replace("/dashboard");
        }}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-0">
        <a
          href="#dashboard-main-content"
          className="sr-only z-[60] rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>

        <DashboardHeader
          onOpenSidebar={() => setMobileOpen(true)}
          isHome={isHome}
        />

        <main
          id="dashboard-main-content"
          className="flex-1 overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-4"
        >
          <div className="w-full">
            {isLoading ? (
              <DashboardLoadingProgress label="Loading" />
            ) : allowed ? (
              children
            ) : (
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
                <p role="status">
                  {user
                    ? "This page is not available for your role. Choose an available module from the sidebar."
                    : "Sign in to access your workspace."}
                </p>
                <Link
                  href={user ? "/modules" : "/login"}
                  className="mt-4 inline-block text-primary"
                >
                  {user ? "Back to modules" : "Sign in"}
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
