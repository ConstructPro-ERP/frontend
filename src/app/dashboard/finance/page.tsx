import type { Metadata } from "next";
import DashboardPlaceholderPage from "@/components/dashboard/DashboardPlaceholderPage";

export const metadata: Metadata = {
  title: "Finance | ConstructPro ERP",
  description: "Finance dashboard workspace for ConstructPro.",
};

export default function FinancePage() {
  return (
    <DashboardPlaceholderPage
      eyebrow="Finance"
      title="Finance Module Layout"
      description="This route now uses the shared dashboard layout with the approved sidebar, header, breadcrumb area, and mobile behavior. Finance-specific implementation can be layered in here without duplicating layout code."
    />
  );
}
