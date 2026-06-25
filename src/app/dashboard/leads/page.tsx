import type { Metadata } from "next";
import DashboardPlaceholderPage from "@/components/dashboard/DashboardPlaceholderPage";

export const metadata: Metadata = {
  title: "Leads | ConstructPro ERP",
  description: "Leads dashboard placeholder for ConstructPro.",
};

export default function LeadsPage() {
  return (
    <DashboardPlaceholderPage
      eyebrow="Leads"
      title="Leads Placeholder"
      description="This route is intentionally lightweight and only provides the shared dashboard frame needed for navigation continuity."
    />
  );
}
