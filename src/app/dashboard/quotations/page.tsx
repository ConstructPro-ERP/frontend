import type { Metadata } from "next";
import DashboardPlaceholderPage from "@/components/dashboard/DashboardPlaceholderPage";

export const metadata: Metadata = {
  title: "Quotations | ConstructPro ERP",
  description: "Quotations dashboard placeholder for ConstructPro.",
};

export default function QuotationsPage() {
  return (
    <DashboardPlaceholderPage
      eyebrow="Quotations"
      title="Quotations Placeholder"
      description="This placeholder route keeps the approved module order available in the reusable dashboard shell without introducing out-of-scope feature detail."
    />
  );
}
