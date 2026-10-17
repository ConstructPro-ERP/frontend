import type { Metadata } from "next";
import DashboardKpiClient from "@/components/dashboard/DashboardKpiClient";

export const metadata: Metadata = {
  title: "Dashboard | ConstructPro ERP",
  description: "Operations dashboard overview for ConstructPro.",
};

export default function DashboardHomePage() {
  return <DashboardKpiClient />;
}
