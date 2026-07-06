export type QuotationStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED";

export interface QuotationItemInput {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotationItem extends QuotationItemInput {
  id: string;
  amount: number;
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
  items: QuotationItem[];
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
