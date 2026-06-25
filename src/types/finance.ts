export type FinanceInvoiceStatus = "PENDING" | "OVERDUE" | "PAID" | "PARTIAL";

export type FinanceInvoiceFilter =
  | "ALL"
  | "PENDING"
  | "OVERDUE"
  | "PAID"
  | "PARTIAL";

export interface FinanceInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  projectName: string;
  invoiceAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  dueDate: string;
  status: FinanceInvoiceStatus;
  pdfUrl?: string | null;
  previewDueNote?: string;
}

export interface FinanceSummary {
  totalInvoiceValue: number;
  totalPaidAmount: number;
  outstandingBalance: number;
  overdueAmount: number;
}

export interface FinanceOutstandingItem {
  id: string;
  clientName: string;
  projectName: string;
  outstandingBalance: number;
  dueDate: string;
  status: Extract<FinanceInvoiceStatus, "PENDING" | "OVERDUE" | "PARTIAL">;
}
