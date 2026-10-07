import apiClient from "@/lib/axios";
import { ApiError } from "@/lib/ApiError";
import type {
  CreateFinancePaymentDto,
  FinanceApiInvoiceStatus,
  FinanceInvoice,
  FinanceInvoiceDetails,
  FinanceInvoiceDto,
  FinanceInvoiceStatus,
  FinancePaymentFormValues,
  FinancePaymentMethod,
  RecordFinancePaymentResponseDto,
} from "@/types/finance";

const statusMap: Record<FinanceApiInvoiceStatus, FinanceInvoiceStatus> = {
  DRAFT: "DRAFT",
  ISSUED: "PENDING",
  PARTIALLY_PAID: "PARTIAL",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
};

const paymentMethodMap: Record<
  FinancePaymentFormValues["paymentMethod"],
  FinancePaymentMethod
> = {
  Cash: "CASH",
  "Bank Transfer": "BANK_TRANSFER",
  Cheque: "CHEQUE",
  Online: "ONLINE",
};

function mapInvoice(dto: FinanceInvoiceDto): FinanceInvoiceDetails {
  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber ?? "Draft invoice",
    clientName: dto.customer.fullName,
    projectName: dto.project.projectName,
    invoiceAmount: dto.totalAmount,
    paidAmount: dto.paidAmount,
    outstandingBalance: dto.outstandingAmount,
    invoiceDate: dto.invoiceDate,
    dueDate: dto.dueDate ?? "",
    status: statusMap[dto.status],
    notes: dto.notes ?? null,
    pdfUrl: dto.pdfUrl,
  };
}

export function createPaymentRequest(
  values: FinancePaymentFormValues,
): CreateFinancePaymentDto {
  return {
    invoiceId: values.invoiceId,
    referenceNumber: values.paymentReference.trim(),
    paymentDate: values.paymentDate,
    amount: Number(values.paymentAmount),
    paymentMethod: paymentMethodMap[values.paymentMethod],
    notes: values.notes.trim() || undefined,
  };
}

export async function listFinanceInvoices(): Promise<FinanceInvoice[]> {
  const response = await apiClient.get<FinanceInvoiceDto[]>("/invoices", {
    params: {
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
  });

  return response.data.map(mapInvoice);
}

export async function getFinanceInvoice(
  invoiceId: string,
): Promise<FinanceInvoiceDetails> {
  const response = await apiClient.get<FinanceInvoiceDto>(
    `/invoices/${invoiceId}`,
  );
  return mapInvoice(response.data);
}

export async function generateFinanceInvoicePdf(
  invoiceId: string,
): Promise<FinanceInvoiceDetails> {
  const response = await apiClient.post<FinanceInvoiceDto>(
    `/invoices/${invoiceId}/pdf`,
    { forceRegenerate: false },
  );
  return mapInvoice(response.data);
}

export async function recordFinancePayment(
  values: FinancePaymentFormValues,
): Promise<RecordFinancePaymentResponseDto> {
  const response = await apiClient.post<RecordFinancePaymentResponseDto>(
    "/payments",
    createPaymentRequest(values),
  );
  return response.data;
}

const financeErrorMessages: Record<string, string> = {
  CANCELLED_INVOICE_PAYMENT_REJECTED:
    "Payments cannot be recorded for a cancelled invoice.",
  INVOICE_ALREADY_PAID: "This invoice is already fully paid.",
  INVOICE_NOT_ISSUED: "Only issued or overdue invoices can receive payments.",
  PAYMENT_REFERENCE_EXISTS: "That payment reference has already been used.",
  PAYMENT_AMOUNT_INVALID: "Payment amount must be greater than zero.",
  PAYMENT_EXCEEDS_OUTSTANDING:
    "Payment amount cannot exceed the outstanding balance.",
  PAYMENT_CONCURRENCY_CONFLICT:
    "The invoice changed while recording the payment. Refresh and try again.",
};

export function getFinanceErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.code === "VALIDATION_ERROR" && error.details?.length) {
    const detail = error.details.find(
      (item): item is string => typeof item === "string",
    );
    if (detail) return detail;
  }

  return financeErrorMessages[error.code] ?? error.message ?? fallback;
}
