import type { Metadata } from "next";
import LeadsDashboardClient from "@/components/dashboard/leads/LeadsDashboardClient";

export const metadata: Metadata = {
  title: "Leads | ConstructPro ERP",
  description: "Capture, qualify, and manage construction leads.",
};

export default function LeadsPage() {
  return <LeadsDashboardClient />;
}
