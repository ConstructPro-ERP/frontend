import type { Metadata } from "next";
import QuotationsDashboardClient from "@/components/dashboard/quotations/QuotationsDashboardClient";

export const metadata: Metadata = {
  title: "Quotations | ConstructPro ERP",
  description:
    "Manage and track quotations, approvals, revisions, and project conversions in ConstructPro ERP.",
};

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string; quotationId?: string }>;
}) {
  const params = await searchParams;
  const leadId = typeof params.leadId === "string" ? params.leadId : "";
  const quotationId =
    typeof params.quotationId === "string" ? params.quotationId : "";
  return (
    <QuotationsDashboardClient
      key={`${leadId}:${quotationId}`}
      initialLeadId={leadId}
      initialQuotationId={quotationId}
    />
  );
}
