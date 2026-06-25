import type { Metadata } from "next";
import DashboardPlaceholderPage from "@/components/dashboard/DashboardPlaceholderPage";

export const metadata: Metadata = {
  title: "Documents | ConstructPro ERP",
  description: "Documents dashboard placeholder for ConstructPro.",
};

export default function DocumentsPage() {
  return (
    <DashboardPlaceholderPage
      eyebrow="Documents"
      title="Documents Placeholder"
      description="This placeholder route exists to complete the shared dashboard navigation and can later host the documents module UI."
    />
  );
}
