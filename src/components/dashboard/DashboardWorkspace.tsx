"use client";

import { Activity, Suspense, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
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

const QuotationsPage = dynamic(
  () => import("./quotations/QuotationsDashboardClient"),
);

function QuotationWorkspace({ pathname }: { pathname: string }) {
  const params = useSearchParams();
  const active = pathname === "/dashboard/quotations";
  const leadId = params?.get("leadId") ?? "";
  const quotationId = params?.get("quotationId") ?? "";
  const key = JSON.stringify([leadId, quotationId]);
  const [visited, setVisited] = useState<
    { key: string; leadId: string; quotationId: string }[]
  >([]);
  if (active && !visited.some((entry) => entry.key === key)) {
    setVisited([...visited, { key, leadId, quotationId }]);
  }
  return visited.map((entry) => (
    <Activity
      key={entry.key}
      mode={active && entry.key === key ? "visible" : "hidden"}
    >
      <QuotationsPage
        initialLeadId={entry.leadId}
        initialQuotationId={entry.quotationId}
      />
    </Activity>
  ));
}

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
      <Suspense
        fallback={pathname === "/dashboard/quotations" ? children : null}
      >
        <QuotationWorkspace pathname={pathname} />
      </Suspense>
      {!targeted && pathname !== "/dashboard/quotations" && children}
    </>
  );
}
