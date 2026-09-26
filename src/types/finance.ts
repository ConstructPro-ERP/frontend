export type FinanceInvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "OVERDUE"
  | "PAID"
  | "PARTIAL"
  | "CANCELLED";

export type FinanceApiInvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type FinancePaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "ONLINE";

export type FinancePaymentMethodLabel =
  | "Cash"
  | "Bank Transfer"
  | "Cheque"
  | "Online";

export type FinanceInvoiceFilter =
  | "ALL"
  | "PENDING"
  | "OVERDUE"
  | "PAID"
  | "PARTIAL"
  | "DRAFT"
  | "CANCELLED";

export interface FinanceInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  projectName: string;
  invoiceAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  dueDate: string;
  invoiceDate?: string;
  status: FinanceInvoiceStatus;
  notes?: string | null;
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

export interface FinanceInvoiceDetails extends FinanceInvoice {
  invoiceDate: string;
  notes?: string | null;
}

export interface FinancePaymentFormValues {
  invoiceId: string;
  paymentAmount: string;
  paymentMethod: FinancePaymentMethodLabel;
  paymentDate: string;
  paymentReference: string;
  notes: string;
}

export interface FinanceInvoiceDto {
  id: string;
  projectId: string;
  customerId: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: FinanceApiInvoiceStatus;
  pdfUrl: string | null;
  notes?: string | null;
  project: { projectName: string };
  customer: { fullName: string };
}

export interface CreateFinancePaymentDto {
  invoiceId: string;
  referenceNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: FinancePaymentMethod;
  notes?: string;
}

export interface FinancePaymentDto {
  id: string;
  invoiceId: string;
  customerId: string;
  referenceNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: FinancePaymentMethod;
  notes: string | null;
}

export interface RecordFinancePaymentResponseDto {
  payment: FinancePaymentDto;
  invoice: Pick<
    FinanceInvoiceDto,
    "id" | "totalAmount" | "paidAmount" | "outstandingAmount" | "status"
  >;
}

export interface FinancePaymentFormErrors {
  invoiceId?: string;
  paymentAmount?: string;
  paymentDate?: string;
  paymentReference?: string;
}
