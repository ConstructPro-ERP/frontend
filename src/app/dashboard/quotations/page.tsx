import type { Metadata } from "next";
import QuotationsDashboardClient from "@/components/dashboard/quotations/QuotationsDashboardClient";

export const metadata: Metadata = {
  title: "Quotations | ConstructPro ERP",
  description: "Quotations dashboard placeholder for ConstructPro.",
};

export default function QuotationsPage() {
  return <QuotationsDashboardClient />;
}
