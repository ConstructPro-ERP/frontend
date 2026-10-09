export type QuotationStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED";

export type QuotationFilterTab = "ALL" | QuotationStatus;

export interface QuotationItemInput {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotationItem extends QuotationItemInput {
  id: string;
  quotationId?: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationLeadSummary {
  id?: string;
  customerName: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface Quotation {
  id: string;
  leadId: string;
  quotationDate: string;
  status: QuotationStatus;
  totalAmount: number;
  pdfUrl: string | null;
  notes: string | null;
  projectId: string | null;
  createdAt?: string;
  updatedAt?: string;
  items: QuotationItem[];
  lead?: QuotationLeadSummary;
}

export interface QuotationFormValues {
  leadId: string;
  notes: string;
  items: QuotationItemInput[];
}

export interface QuotationFormErrors {
  leadId?: string;
  items?: string;
}

export interface RejectQuotationInput {
  reason: string;
}

export interface UpdateQuotationInput {
  notes?: string;
  items?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface ConvertToProjectInput {
  projectName?: string;
  startDate?: string;
  projectManagerId?: string;
  budget?: number;
  targetProjectId?: string;
}

export interface ConvertToProjectResponse {
  quotation: Quotation;
  projectId: string;
  projectStatus: string;
}

export interface QuotationListResponse {
  items: Quotation[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}
