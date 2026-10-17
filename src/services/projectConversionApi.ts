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
    typeof data.projectId === "string" &&
    data.projectId.trim().length > 0
  ) {
    const projResponse = data as ConvertToProjectResponse;
    return {
      quotation: {
        ...(projResponse.quotation ?? (data as unknown as Quotation)),
        projectId: projResponse.projectId,
      },
      projectId: projResponse.projectId,
      projectStatus: projResponse.projectStatus ?? "ACTIVE",
    };
  }

  throw new Error(
    "The server did not return a project ID. Refresh the quotation before retrying conversion.",
  );
}
