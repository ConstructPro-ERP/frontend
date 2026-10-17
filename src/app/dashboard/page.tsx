import type { Metadata } from "next";
import ProjectsDashboardClient from "@/components/dashboard/projects/ProjectsDashboardClient";

export const metadata: Metadata = {
  title: "Projects | ConstructPro ERP",
  description:
    "Manage construction projects, progress, and project operations.",
};

export default function ProjectsPage() {
  return <ProjectsDashboardClient />;
}
