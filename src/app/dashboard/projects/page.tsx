import type { Metadata } from "next";
import ProjectsDashboardClient from "@/components/dashboard/projects/ProjectsDashboardClient";
export const metadata: Metadata = {
  title: "Projects | ConstructPro ERP",
  description: "Manage construction projects, milestones, tasks, and expenses.",
};
export default function ProjectsPage() {
  return <ProjectsDashboardClient />;
}
