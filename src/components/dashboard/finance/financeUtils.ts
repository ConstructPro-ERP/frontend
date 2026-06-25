import { ApiError } from "@/lib/ApiError";
import type {
  FinanceInvoice,
  FinanceInvoiceFilter,
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
];

export const financePreviewInvoices: FinanceInvoice[] = [
  {
    id: "inv-2026-022",
    invoiceNumber: "INV-2026-022",
    clientName: "K. Perera",
    projectName: "Villa Perera - Col 5",
    invoiceAmount: 5_250_000,
    paidAmount: 5_250_000,
    outstandingBalance: 0,
    dueDate: "2026-04-01",
    status: "PAID",
    pdfUrl: null,
    previewDueNote: "Apr 1, 2026",
  },
  {
    id: "inv-2026-021",
    invoiceNumber: "INV-2026-021",
    clientName: "S. Fernando",
    projectName: "Sunset Residency",
    invoiceAmount: 3_200_000,
    paidAmount: 1_000_000,
    outstandingBalance: 2_200_000,
    dueDate: "2026-03-15",
    status: "OVERDUE",
    pdfUrl: null,
    previewDueNote: "28 days overdue",
  },
  {
    id: "inv-2026-020",
    invoiceNumber: "INV-2026-020",
    clientName: "R. Wijesinghe",
    projectName: "Blue Horizon - Galle",
    invoiceAmount: 8_400_000,
    paidAmount: 4_200_000,
    outstandingBalance: 4_200_000,
    dueDate: "2026-04-20",
    status: "PARTIAL",
    pdfUrl: null,
    previewDueNote: "Due Apr 20",
  },
  {
    id: "inv-2026-019",
    invoiceNumber: "INV-2026-019",
    clientName: "D. Rajapaksa",
    projectName: "Kandy Heights Phase II",
    invoiceAmount: 4_625_000,
    paidAmount: 4_625_000,
    outstandingBalance: 0,
    dueDate: "2026-03-30",
    status: "PAID",
    pdfUrl: null,
    previewDueNote: "Mar 30, 2026",
  },
  {
    id: "inv-2026-018",
    invoiceNumber: "INV-2026-018",
    clientName: "P. Gunawardena",
    projectName: "Emerald Tower - Col 7",
    invoiceAmount: 16_875_000,
    paidAmount: 14_000_000,
    outstandingBalance: 2_875_000,
    dueDate: "2026-03-20",
    status: "OVERDUE",
    pdfUrl: null,
    previewDueNote: "23 days overdue",
  },
  {
    id: "inv-2026-017",
    invoiceNumber: "INV-2026-017",
    clientName: "L. Fernando",
    projectName: "Lakshan Fernando - Warehouse",
    invoiceAmount: 6_300_000,
    paidAmount: 0,
    outstandingBalance: 6_300_000,
    dueDate: "2026-04-30",
    status: "PENDING",
    pdfUrl: null,
    previewDueNote: "Due Apr 30",
  },
];

export const financePreviewSummary: FinanceSummary = {
  totalInvoiceValue: 55_000_000,
  totalPaidAmount: 48_200_000,
  outstandingBalance: 6_800_000,
  overdueAmount: 5_075_000,
};

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
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function normalizeFinanceStatus(value: unknown): FinanceInvoiceStatus {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");

  if (normalized === "PARTIALLY_PAID" || normalized === "PARTIAL") {
    return "PARTIAL";
  }

  if (
    normalized === "PENDING" ||
    normalized === "OVERDUE" ||
    normalized === "PAID"
  ) {
    return normalized;
  }

  return "PENDING";
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
    .filter((invoice) => invoice.outstandingBalance > 0)
    .map((invoice) => ({
      id: invoice.id,
      clientName: invoice.clientName,
      projectName: invoice.projectName,
      outstandingBalance: invoice.outstandingBalance,
      dueDate: invoice.dueDate,
      status:
        invoice.status === "PAID"
          ? "PENDING"
          : (invoice.status as "PENDING" | "OVERDUE" | "PARTIAL"),
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
    default:
      return "Pending";
  }
}

function readString(
  source: Record<string, unknown>,
  keys: string[],
  fallback: string,
) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
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

function normalizeInvoiceRecord(
  record: Record<string, unknown>,
  index: number,
) {
  const invoiceAmount = readNumber(
    record,
    ["invoiceAmount", "amountDue", "amount_due", "invoice_amount", "amount"],
    0,
  );
  const paidAmount = readNumber(
    record,
    ["paidAmount", "amountPaid", "amount_paid"],
    0,
  );
  const outstandingBalance = readNumber(
    record,
    [
      "outstandingBalance",
      "outstanding_balance",
      "balance",
      "balance_due",
      "remainingAmount",
    ],
    Math.max(invoiceAmount - paidAmount, 0),
  );

  return {
    id: readString(
      record,
      ["id", "invoiceId", "invoice_id"],
      `invoice-${index}`,
    ),
    invoiceNumber: readString(
      record,
      ["invoiceNumber", "invoice_number", "invoiceNo", "invoice_no", "number"],
      `INV-${index + 1}`,
    ),
    clientName: readString(
      record,
      ["clientName", "client_name", "client", "customerName", "customer_name"],
      "Unknown client",
    ),
    projectName: readString(
      record,
      ["projectName", "project_name", "project"],
      "Unnamed project",
    ),
    invoiceAmount,
    paidAmount,
    outstandingBalance,
    dueDate: readString(
      record,
      ["dueDate", "due_date", "paymentDueDate", "payment_due_date"],
      "",
    ),
    status: normalizeFinanceStatus(record.status),
    pdfUrl: readString(record, ["pdfUrl", "pdf_url"], ""),
    previewDueNote: readString(
      record,
      ["previewDueNote", "preview_due_note", "dueNote", "due_note"],
      "",
    ),
  } satisfies FinanceInvoice;
}

export function normalizeInvoices(payload: unknown): FinanceInvoice[] {
  const records = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null
      ? ((payload as Record<string, unknown>).items ??
        (payload as Record<string, unknown>).invoices ??
        (payload as Record<string, unknown>).results ??
        [])
      : [];

  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .filter(
      (record): record is Record<string, unknown> =>
        typeof record === "object" && record !== null,
    )
    .map((record, index) => normalizeInvoiceRecord(record, index));
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
    error.statusCode === 404 ||
    error.statusCode === 405 ||
    error.statusCode === 501 ||
    error.statusCode === 503
  );
}
