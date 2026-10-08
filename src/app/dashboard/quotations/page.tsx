import type { Metadata } from "next";
import QuotationsDashboardClient from "@/components/dashboard/quotations/QuotationsDashboardClient";

export const metadata: Metadata = {
  title: "Quotations | ConstructPro ERP",
  description:
    "Manage and track quotations, approvals, revisions, and project conversions in ConstructPro ERP.",
};

export default function QuotationsPage() {
  return <QuotationsDashboardClient />;
}
