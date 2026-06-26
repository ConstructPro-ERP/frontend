import type { Metadata } from "next";
import AnalyticsDashboardClient from "@/components/dashboard/analytics/AnalyticsDashboardClient";

export const metadata: Metadata = {
  title: "Analytics | ConstructPro ERP",
  description:
    "Analytics dashboard for KPI summaries, revenue, payments, projects, and risks.",
};

export default function AnalyticsPage() {
  return <AnalyticsDashboardClient />;
}
