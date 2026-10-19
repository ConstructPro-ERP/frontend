import { normalizeQuotationRecord } from "@/components/dashboard/quotations/quotationUtils";
import apiClient from "@/lib/axios";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";
import type {
  ConvertToProjectInput,
  ConvertToProjectResponse,
  Quotation,
} from "@/types/quotation";

/**
 * Convert an approved quotation into a project.
 * Submits to the quotation approve endpoint with project details or target project link.
 */
export async function convertQuotationToProject(
  quotationId: string,
  payload: ConvertToProjectInput,
): Promise<ConvertToProjectResponse> {
  const response = await apiClient.patch<ConvertToProjectResponse | Quotation>(
    `/quotations/${quotationId}/approve`,
    payload,
    { timeout: 15000 },
  );

  dashboardQueryCache.invalidate();
  const data = response.data;

  // Do not fabricate project linkage when the backend returns partial data.
  if (
    !data ||
    typeof data !== "object" ||
    !("quotation" in data) ||
    !data.quotation ||
    typeof data.projectId !== "string" ||
    !data.projectId.trim() ||
    typeof data.projectStatus !== "string" ||
    !["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"].includes(
      data.projectStatus,
    )
  ) {
    throw new Error(
      "The conversion response could not be verified. Refresh the quotation before retrying.",
    );
  }

  const quotation = normalizeQuotationRecord(
    data.quotation as unknown as Record<string, unknown>,
    0,
  );

  if (
    quotation.id !== quotationId ||
    quotation.status !== "CONVERTED" ||
    quotation.projectId !== data.projectId
  ) {
    throw new Error(
      "The conversion response could not be verified. Refresh the quotation before retrying.",
    );
  }

  return {
    quotation,
    projectId: data.projectId,
    projectStatus: data.projectStatus,
  };
}
