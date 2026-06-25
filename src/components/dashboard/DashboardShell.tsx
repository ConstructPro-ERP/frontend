"use client";

import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-bg">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-0">
        <a
          href="#dashboard-main-content"
          className="sr-only z-[60] rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>

        <DashboardHeader onOpenSidebar={() => setMobileOpen(true)} />

        <main
          id="dashboard-main-content"
          className="flex-1 overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-4"
        >
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
