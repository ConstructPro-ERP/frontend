"use client";

import { Activity, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

const pages = {
  "/dashboard": dynamic(() => import("./DashboardKpiClient")),
  "/dashboard/analytics": dynamic(
    () => import("./analytics/AnalyticsDashboardClient"),
  ),
  "/dashboard/finance": dynamic(
    () => import("./finance/FinanceDashboardClient"),
  ),
  "/dashboard/users": dynamic(() => import("./users/UsersDashboardClient")),
};

export default function DashboardWorkspace({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) {
  const [visited, setVisited] = useState<string[]>([]);
  const targeted = Object.hasOwn(pages, pathname);
  if (targeted && !visited.includes(pathname))
    setVisited([...visited, pathname]);

  return (
    <>
      {visited.map((path) => {
        const Page = pages[path as keyof typeof pages];
        return (
          <Activity key={path} mode={pathname === path ? "visible" : "hidden"}>
            <Page />
          </Activity>
        );
      })}
      {!targeted && children}
    </>
  );
}
