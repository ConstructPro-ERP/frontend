import { ApiError } from "@/lib/ApiError";
import type {
  FinanceInvoice,
  FinanceInvoiceFilter,
  FinancePaymentFormErrors,
  FinancePaymentFormValues,
  FinanceInvoiceStatus,
  FinanceOutstandingItem,
  FinanceSummary,
} from "@/types/finance";

export const financeFilterTabs: Array<{
  label: string;
  value: FinanceInvoiceFilter;
}> = [
  { label: "All Invoices", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Paid", value: "PAID" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const defaultFinancePaymentMethod = "Bank Transfer";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `LKR ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }

  return formatCurrency(value);
}

export function formatDate(value: string) {
  if (!value) return "Not set";

  const datePart = /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : value;
  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? `${datePart}T00:00:00` : datePart,
  );

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function filterInvoices(
  invoices: FinanceInvoice[],
  filter: FinanceInvoiceFilter,
) {
  if (filter === "ALL") {
    return invoices;
  }

  return invoices.filter((invoice) => invoice.status === filter);
}

export function calculateFinanceSummary(
  invoices: FinanceInvoice[],
): FinanceSummary {
  return invoices.reduce<FinanceSummary>(
    (summary, invoice) => {
      summary.totalInvoiceValue += invoice.invoiceAmount;
      summary.totalPaidAmount += invoice.paidAmount;
      summary.outstandingBalance += invoice.outstandingBalance;

      if (invoice.status === "OVERDUE") {
        summary.overdueAmount += invoice.outstandingBalance;
      }

      return summary;
    },
    {
      totalInvoiceValue: 0,
      totalPaidAmount: 0,
      outstandingBalance: 0,
      overdueAmount: 0,
    },
  );
}

export function buildOutstandingBalances(
  invoices: FinanceInvoice[],
): FinanceOutstandingItem[] {
  return invoices
    .filter(
      (invoice) =>
        invoice.outstandingBalance > 0 &&
        ["PENDING", "OVERDUE", "PARTIAL"].includes(invoice.status),
    )
    .map((invoice) => ({
      id: invoice.id,
      clientName: invoice.clientName,
      projectName: invoice.projectName,
      outstandingBalance: invoice.outstandingBalance,
      dueDate: invoice.dueDate,
      status: invoice.status as "PENDING" | "OVERDUE" | "PARTIAL",
    }));
}

export function getFinanceStatusBadgeClasses(status: FinanceInvoiceStatus) {
  switch (status) {
    case "PAID":
      return "bg-risk-low-container text-risk-low";
    case "OVERDUE":
      return "bg-error-container text-error";
    case "PARTIAL":
      return "bg-risk-medium-container text-risk-medium";
    case "PENDING":
      return "bg-primary-soft text-primary";
    case "DRAFT":
      return "bg-surface-container-high text-on-surface-variant";
    case "CANCELLED":
      return "bg-error-container text-error";
    default:
      return "bg-primary-soft text-primary";
  }
}

export function getFinanceStatusLabel(status: FinanceInvoiceStatus) {
  switch (status) {
    case "PARTIAL":
      return "Partial";
    case "OVERDUE":
      return "Overdue";
    case "PAID":
      return "Paid";
    case "PENDING":
      return "Pending";
    case "DRAFT":
      return "Draft";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export function findFinanceInvoiceById(
  invoices: FinanceInvoice[],
  invoiceId: string,
) {
  return invoices.find((invoice) => invoice.id === invoiceId);
}

export function createFinancePaymentFormValues(
  invoice?: FinanceInvoice,
): FinancePaymentFormValues {
  return {
    invoiceId: invoice?.id ?? "",
    paymentAmount:
      invoice && invoice.outstandingBalance > 0
        ? String(invoice.outstandingBalance)
        : "",
    paymentMethod: defaultFinancePaymentMethod,
    paymentDate: formatLocalDateForApi(new Date()),
    paymentReference: "",
    notes: "",
  };
}

export function formatLocalDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateFinancePaymentForm(
  values: FinancePaymentFormValues,
  invoices: FinanceInvoice[],
): FinancePaymentFormErrors {
  const errors: FinancePaymentFormErrors = {};
  const selectedInvoice = findFinanceInvoiceById(invoices, values.invoiceId);
  const parsedAmount = Number(values.paymentAmount);

  if (!values.invoiceId.trim()) {
    errors.invoiceId = "Invoice selection is required.";
  }

  if (!values.paymentAmount.trim()) {
    errors.paymentAmount = "Payment amount is required.";
  } else if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    errors.paymentAmount = "Payment amount must be greater than zero.";
  } else if (
    selectedInvoice &&
    parsedAmount > selectedInvoice.outstandingBalance
  ) {
    errors.paymentAmount =
      "Payment amount must not exceed the outstanding balance.";
  }

  if (!values.paymentDate.trim()) {
    errors.paymentDate = "Payment date is required.";
  }

  if (!values.paymentReference.trim()) {
    errors.paymentReference = "Payment reference is required.";
  }

  return errors;
}

function readNumber(
  source: Record<string, unknown>,
  keys: string[],
  fallback: number,
) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

export function normalizeSummary(
  payload: unknown,
  invoices: FinanceInvoice[],
): FinanceSummary {
  const fallback = calculateFinanceSummary(invoices);

  if (typeof payload !== "object" || payload === null) {
    return fallback;
  }

  const record = payload as Record<string, unknown>;

  return {
    totalInvoiceValue: readNumber(
      record,
      ["totalInvoiceValue", "total_invoice_value", "totalInvoiced"],
      fallback.totalInvoiceValue,
    ),
    totalPaidAmount: readNumber(
      record,
      ["totalPaidAmount", "total_paid_amount", "totalCollected"],
      fallback.totalPaidAmount,
    ),
    outstandingBalance: readNumber(
      record,
      ["outstandingBalance", "outstanding_balance", "totalOutstanding"],
      fallback.outstandingBalance,
    ),
    overdueAmount: readNumber(
      record,
      ["overdueAmount", "overdue_amount", "totalOverdue"],
      fallback.overdueAmount,
    ),
  };
}

export function isFinanceUnavailableError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  return (
    error.code === "NETWORK_ERROR" ||
    error.statusCode === 502 ||
    error.statusCode === 404 ||
    error.statusCode === 405 ||
    error.statusCode === 501 ||
    error.statusCode === 503
  );
}
