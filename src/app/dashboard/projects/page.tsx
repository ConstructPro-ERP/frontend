import type { Metadata } from "next";
import DashboardPlaceholderPage from "@/components/dashboard/DashboardPlaceholderPage";

export const metadata: Metadata = {
  title: "Projects | ConstructPro ERP",
  description: "Projects dashboard placeholder for ConstructPro.",
};

export default function ProjectsPage() {
  return (
    <DashboardPlaceholderPage
      eyebrow="Projects"
      title="Projects Placeholder"
      description="This route is prepared for future project content while already inheriting the shared dashboard sidebar and header."
    />
  );
}
