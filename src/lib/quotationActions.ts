import type { QuotationStatus } from "@/types/quotation";
export function quotationActions(
  role: string | null | undefined,
  status: QuotationStatus,
) {
  const write = role === "ADMIN" || role === "SALES_MANAGER";
  return {
    edit: write && (status === "DRAFT" || status === "PENDING_APPROVAL"),
    submit: write && status === "DRAFT",
    approve: write && status === "PENDING_APPROVAL",
    reject: write && status === "PENDING_APPROVAL",
    revise: write && status === "REJECTED",
    convert: write && (status === "APPROVED" || status === "PENDING_APPROVAL"),
  };
}
export function safePdfUrl(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Quotation PDF is not available. Please try again.");
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error();
    return url.href;
  } catch {
    throw new Error("Quotation PDF is not available. Please try again.");
  }
}
