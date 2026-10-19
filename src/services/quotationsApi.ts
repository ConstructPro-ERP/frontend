import {
  normalizeQuotationRecord,
  normalizeQuotations,
} from "@/components/dashboard/quotations/quotationUtils";
import apiClient from "@/lib/axios";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";
import type {
  CreateQuotationDto,
  ListQuotationsParams,
  Quotation,
  QuotationListResponse,
  RejectQuotationInput,
  UpdateQuotationInput,
} from "@/types/quotation";

// The shared interceptor uses retryCount to cap retries. Creation has no backend
// idempotency key, so do not replay it after a network/5xx ambiguity.
const createRequestOptions = { timeout: 15000, retryCount: 3 };

function normalizeResponse(data: unknown): Quotation {
  if (
    !data ||
    typeof data !== "object" ||
    !("id" in data) ||
    typeof data.id !== "string" ||
    !data.id.trim()
  ) {
    throw new Error(
      "Quotation response could not be verified. Refresh before retrying.",
    );
  }
  return normalizeQuotationRecord(data as Record<string, unknown>, 0);
}

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
  if (params?.search && params.search.trim()) {
    queryParams.search = params.search.trim();
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
  if (!data || typeof data !== "object")
    throw new Error("Invalid quotation list response.");
  if ("items" in data && Array.isArray(data.items)) {
    return {
      items: normalizeQuotations(data),
      total: typeof data.total === "number" ? data.total : data.items.length,
      page: "page" in data ? data.page : 1,
      limit: "limit" in data ? data.limit : data.items.length,
      totalPages: "totalPages" in data ? data.totalPages : 1,
    };
  }

  if (Array.isArray(data)) {
    return {
      items: normalizeQuotations(data),
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
  return normalizeResponse(response.data);
}

/**
 * Create a new quotation.
 */
export async function createQuotation(
  payload: CreateQuotationDto,
): Promise<Quotation> {
  const response = await apiClient.post<Quotation>(
    "/quotations",
    {
      leadId: payload.leadId.trim(),
      notes: payload.notes?.trim() || undefined,
      items: payload.items.map((item) => ({
        itemName: item.itemName.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    },
    createRequestOptions,
  );
  dashboardQueryCache.invalidate();
  return normalizeResponse(response.data);
}

/**
 * Update an existing quotation's notes and line items.
 */
export async function updateQuotation(
  id: string,
  payload: UpdateQuotationInput,
): Promise<Quotation> {
  const response = await apiClient.put<Quotation>(`/quotations/${id}`, payload);
  dashboardQueryCache.invalidate();
  return normalizeResponse(response.data);
}

/**
 * Approve a quotation (or approve and optionally link to project).
 */
export async function approveQuotation(id: string): Promise<Quotation> {
  const response = await apiClient.patch<Quotation>(
    `/quotations/${id}/direct-approve`,
    {},
  );
  dashboardQueryCache.invalidate();
  return normalizeResponse(response.data);
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
  dashboardQueryCache.invalidate();
  return normalizeResponse(response.data);
}

/**
 * Revise a rejected quotation back to Draft.
 */
export async function reviseQuotation(id: string): Promise<Quotation> {
  const response = await apiClient.patch<Quotation>(
    `/quotations/${id}/revise`,
    {},
  );
  dashboardQueryCache.invalidate();
  return normalizeResponse(response.data);
}

/**
 * Fetch or generate the quotation PDF.
 */
export async function getQuotationPdf(id: string): Promise<{ pdfUrl: string }> {
  const response = await apiClient.get<{ pdfUrl: string }>(
    `/quotations/${id}/pdf`,
    { timeout: 15000 },
  );
  return response.data;
}

/**
 * Submit a draft quotation for approval.
 */
export async function submitQuotation(id: string): Promise<Quotation> {
  const response = await apiClient.patch<Quotation>(
    `/quotations/${id}/submit`,
    {},
  );
  dashboardQueryCache.invalidate();
  return normalizeResponse(response.data);
}
