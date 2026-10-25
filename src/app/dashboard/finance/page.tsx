import type { Metadata } from "next";
import FinanceDashboardClient from "@/components/dashboard/finance/FinanceDashboardClient";

export const metadata: Metadata = {
  title: "Finance | ConstructPro ERP",
  description: "Finance dashboard for invoices, payment status, and summaries.",
};

export default function FinancePage() {
  return <FinanceDashboardClient />;
}
