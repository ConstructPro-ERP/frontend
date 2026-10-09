import apiClient from "@/lib/axios";
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
  );

  const data = response.data;

  // Handle nested response format
  if (
    data &&
    typeof data === "object" &&
    "projectId" in data &&
    typeof data.projectId === "string"
  ) {
    const projResponse = data as ConvertToProjectResponse;
    return {
      quotation: projResponse.quotation ?? (data as unknown as Quotation),
      projectId: projResponse.projectId,
      projectStatus: projResponse.projectStatus ?? "ACTIVE",
    };
  }

  // Handle flat quotation return fallback
  const quotation = data as Quotation;
  return {
    quotation: { ...quotation, status: "CONVERTED" },
    projectId: quotation.projectId ?? `PRJ-${quotation.id}`,
    projectStatus: "ACTIVE",
  };
}
