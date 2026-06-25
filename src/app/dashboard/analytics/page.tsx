import type { Metadata } from "next";
import DashboardPlaceholderPage from "@/components/dashboard/DashboardPlaceholderPage";

export const metadata: Metadata = {
  title: "Analytics | ConstructPro ERP",
  description: "Analytics dashboard workspace for ConstructPro.",
};

export default function AnalyticsPage() {
  return (
    <DashboardPlaceholderPage
      eyebrow="Analytics"
      title="Analytics Module Layout"
      description="This route shares the exact same dashboard shell as Finance, keeping navigation, header behavior, page-title presentation, breadcrumbs, and responsive sidebar handling consistent across modules."
    />
  );
}
