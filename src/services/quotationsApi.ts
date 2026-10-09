import apiClient from "@/lib/axios";
import type {
  ConvertToProjectInput,
  ConvertToProjectResponse,
  CreateQuotationDto,
  ListQuotationsParams,
  Quotation,
  QuotationListResponse,
  RejectQuotationInput,
  UpdateQuotationInput,
} from "@/types/quotation";

/**
 * Fetch paginated or filtered list of quotations.
 */
export async function listQuotations(
  params?: ListQuotationsParams,
): Promise<QuotationListResponse> {
  const queryParams: Record<string, string | number> = {};

  if (params?.status && params.status !== "ALL") {
    queryParams.status = params.status;
  }
  if (params?.leadId) {
    queryParams.leadId = params.leadId;
  }
  if (params?.page) {
    queryParams.page = params.page;
  }
  if (params?.limit) {
    queryParams.limit = params.limit;
  }

  const response = await apiClient.get<
    QuotationListResponse | { items: Quotation[]; total: number }
  >("/quotations", {
    params: queryParams,
  });

  const data = response.data;
  if ("items" in data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: typeof data.total === "number" ? data.total : data.items.length,
      page: "page" in data ? data.page : 1,
      limit: "limit" in data ? data.limit : data.items.length,
      totalPages: "totalPages" in data ? data.totalPages : 1,
    };
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    };
  }

  return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
}

/**
 * Fetch a single quotation by ID.
 */
export async function getQuotationById(id: string): Promise<Quotation> {
  const response = await apiClient.get<Quotation>(`/quotations/${id}`);
  return response.data;
}

/**
 * Create a new quotation.
 */
export async function createQuotation(
  payload: CreateQuotationDto,
): Promise<Quotation> {
  const response = await apiClient.post<Quotation>("/quotations", {
    leadId: payload.leadId.trim(),
    notes: payload.notes?.trim() || undefined,
    items: payload.items.map((item) => ({
      itemName: item.itemName.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
  });
  return response.data;
}

/**
 * Update an existing quotation's notes and line items.
 */
export async function updateQuotation(
  id: string,
  payload: UpdateQuotationInput,
): Promise<Quotation> {
  const response = await apiClient.put<Quotation>(
    `/quotations/${id}`,
    payload,
  );
  return response.data;
}

/**
 * Approve a quotation (or approve and optionally link to project).
 */
export async function approveQuotation(
  id: string,
  payload?: Partial<ConvertToProjectInput>,
): Promise<ConvertToProjectResponse | Quotation> {
  const response = await apiClient.patch<
    ConvertToProjectResponse | Quotation
  >(`/quotations/${id}/approve`, payload ?? {});
  return response.data;
}

/**
 * Reject a quotation with mandatory reason.
 */
export async function rejectQuotation(
  id: string,
  payload: RejectQuotationInput,
): Promise<Quotation> {
  const response = await apiClient.patch<Quotation>(
    `/quotations/${id}/reject`,
    { reason: payload.reason.trim() },
  );
  return response.data;
}

/**
 * Revise a rejected quotation back to Draft.
 */
export async function reviseQuotation(id: string): Promise<Quotation> {
  const response = await apiClient.patch<Quotation>(
    `/quotations/${id}/revise`,
    {},
  );
  return response.data;
}

/**
 * Fetch or generate the quotation PDF.
 */
export async function getQuotationPdf(
  id: string,
): Promise<{ pdfUrl: string }> {
  const response = await apiClient.get<{ pdfUrl: string }>(
    `/quotations/${id}/pdf`,
  );
  return response.data;
}

/**
 * Mark quotation as sent to client.
 */
export async function sendQuotation(id: string): Promise<Quotation> {
  const response = await apiClient.patch<Quotation>(
    `/quotations/${id}/send`,
    {},
  );
  return response.data;
}
