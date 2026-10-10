import { ApiError } from "@/lib/ApiError";
import type {
  Quotation,
  QuotationFilterTab,
  QuotationFormErrors,
  QuotationFormValues,
  QuotationItem,
  QuotationLeadSummary,
  QuotationStatus,
} from "@/types/quotation";

/**
 * Floating-point calculation helpers synchronized with backend round2 precision
 */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateLineItemAmount(
  quantity: number,
  unitPrice: number,
): number {
  return round2(quantity * unitPrice);
}

export function calculateTotalAmount(
  items: Array<{ quantity: number; unitPrice: number }>,
): number {
  const total = items.reduce(
    (sum, item) => sum + round2(item.quantity * item.unitPrice),
    0,
  );
  return round2(total);
}

export function createQuotationFormValues(): QuotationFormValues {
  return {
    leadId: "",
    notes: "",
    items: [{ itemName: "", quantity: 1, unitPrice: 0 }],
  };
}

export function validateQuotationForm(
  values: QuotationFormValues,
): QuotationFormErrors {
  const errors: QuotationFormErrors = {};

  if (!values.leadId.trim()) {
    errors.leadId = "Lead ID is required.";
  }

  if (values.items.length === 0) {
    errors.items = "At least one item is required.";
  } else {
    for (let index = 0; index < values.items.length; index += 1) {
      const item = values.items[index];

      if (!item.itemName.trim()) {
        errors.items = `Item ${index + 1}: item name is required.`;
        break;
      }

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        errors.items = `Item ${index + 1}: quantity must be greater than zero.`;
        break;
      }

      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        errors.items = `Item ${index + 1}: unit price must be zero or greater.`;
        break;
      }
    }
  }

  return errors;
}

export const quotationFilterTabs: Array<{
  id: QuotationFilterTab;
  label: string;
}> = [
  { id: "ALL", label: "All Quotations" },
  { id: "DRAFT", label: "Draft" },
  { id: "SENT", label: "Sent" },
  { id: "PENDING_APPROVAL", label: "Pending Approval" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "CONVERTED", label: "Converted" },
];

export const quotationPreviewList: Quotation[] = [
  {
    id: "quo-2026-014",
    leadId: "lead-2026-108",
    quotationDate: "2026-04-02",
    status: "PENDING_APPROVAL",
    totalAmount: 1_850_000,
    pdfUrl: null,
    notes: "Awaiting manager approval before sending to client.",
    projectId: null,
    lead: {
      id: "lead-2026-108",
      customerName: "Skyline Heights",
      status: "QUALIFIED",
    },
    items: [
      {
        id: "quo-2026-014-item-1",
        itemName: "Site survey & soil testing",
        quantity: 1,
        unitPrice: 350_000,
        amount: 350_000,
      },
      {
        id: "quo-2026-014-item-2",
        itemName: "Foundation works",
        quantity: 1,
        unitPrice: 1_500_000,
        amount: 1_500_000,
      },
    ],
  },
  {
    id: "quo-2026-013",
    leadId: "lead-2026-101",
    quotationDate: "2026-03-22",
    status: "APPROVED",
    totalAmount: 4_275_000,
    pdfUrl: null,
    notes: null,
    projectId: "proj-2026-009",
    lead: {
      id: "lead-2026-101",
      customerName: "Lotus Villa",
      status: "WON",
    },
    items: [
      {
        id: "quo-2026-013-item-1",
        itemName: "Structural framing",
        quantity: 1,
        unitPrice: 2_775_000,
        amount: 2_775_000,
      },
      {
        id: "quo-2026-013-item-2",
        itemName: "Roofing (sheets & installation)",
        quantity: 1,
        unitPrice: 1_500_000,
        amount: 1_500_000,
      },
    ],
  },
  {
    id: "quo-2026-012",
    leadId: "lead-2026-095",
    quotationDate: "2026-03-10",
    status: "REJECTED",
    totalAmount: 960_000,
    pdfUrl: null,
    notes:
      "[Rejection Reason]: Client requested a revised quotation with a lower budget.",
    projectId: null,
    lead: {
      id: "lead-2026-095",
      customerName: "Ocean Breeze",
      status: "CONTACTED",
    },
    items: [
      {
        id: "quo-2026-012-item-1",
        itemName: "Interior finishing (paint & tiling)",
        quantity: 1,
        unitPrice: 960_000,
        amount: 960_000,
      },
    ],
  },
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
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

export function getQuotationStatusBadgeClasses(status: QuotationStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-risk-low-container text-risk-low";
    case "CONVERTED":
      return "bg-primary-soft text-primary";
    case "REJECTED":
      return "bg-error-container text-error";
    case "PENDING_APPROVAL":
      return "bg-risk-medium-container text-risk-medium";
    case "SENT":
      return "border border-secondary/30 bg-secondary-container text-secondary";
    case "DRAFT":
    default:
      return "bg-surface-container text-on-surface-muted";
  }
}

export function getQuotationStatusLabel(status: QuotationStatus) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending Approval";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "CONVERTED":
      return "Converted";
    case "SENT":
      return "Sent";
    case "DRAFT":
    default:
      return "Draft";
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

function readNullableString(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
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

export function normalizeQuotationStatus(value: unknown): QuotationStatus {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");

  if (
    normalized === "DRAFT" ||
    normalized === "PENDING_APPROVAL" ||
    normalized === "APPROVED" ||
    normalized === "REJECTED" ||
    normalized === "CONVERTED"
  ) {
    return normalized;
  }

  return "DRAFT";
}

function normalizeQuotationItemRecord(
  record: Record<string, unknown>,
  index: number,
): QuotationItem {
  const quantity = readNumber(record, ["quantity", "qty"], 0);
  const unitPrice = readNumber(record, ["unitPrice", "unit_price", "price"], 0);

  return {
    id: readString(record, ["id", "itemId", "item_id"], `item-${index}`),
    quotationId: readString(record, ["quotationId", "quotation_id"], ""),
    itemName: readString(
      record,
      ["itemName", "item_name", "name", "description"],
      "Unnamed item",
    ),
    quantity,
    unitPrice,
    amount: readNumber(
      record,
      ["amount", "total", "lineTotal"],
      calculateLineItemAmount(quantity, unitPrice),
    ),
    createdAt:
      readNullableString(record, ["createdAt", "created_at"]) ?? undefined,
    updatedAt:
      readNullableString(record, ["updatedAt", "updated_at"]) ?? undefined,
  };
}

function normalizeQuotationItems(payload: unknown): QuotationItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter(
      (record): record is Record<string, unknown> =>
        typeof record === "object" && record !== null,
    )
    .map((record, index) => normalizeQuotationItemRecord(record, index));
}

function normalizeQuotationLead(
  payload: unknown,
): QuotationLeadSummary | undefined {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const customerName = readString(
    record,
    ["customerName", "customer_name", "name"],
    "",
  );

  if (!customerName) {
    return undefined;
  }

  return {
    id: readNullableString(record, ["id", "leadId", "lead_id"]) ?? undefined,
    customerName,
    email: readNullableString(record, ["email"]) ?? undefined,
    phone: readNullableString(record, ["phone"]) ?? undefined,
    status: readNullableString(record, ["status"]) ?? undefined,
  };
}

export function normalizeQuotationRecord(
  record: Record<string, unknown>,
  index: number,
): Quotation {
  const items = normalizeQuotationItems(record.items);
  const calculatedTotal = calculateTotalAmount(items);

  return {
    id: readString(
      record,
      ["id", "quotationId", "quotation_id"],
      `quotation-${index}`,
    ),
    leadId: readString(record, ["leadId", "lead_id"], ""),
    quotationDate: readString(
      record,
      ["quotationDate", "quotation_date", "createdAt", "created_at"],
      new Date().toISOString(),
    ),
    status: normalizeQuotationStatus(record.status),
    totalAmount: readNumber(
      record,
      ["totalAmount", "total_amount", "total"],
      calculatedTotal,
    ),
    pdfUrl: readNullableString(record, ["pdfUrl", "pdf_url"]),
    notes: readNullableString(record, ["notes", "note"]),
    projectId: readNullableString(record, ["projectId", "project_id"]),
    createdAt:
      readNullableString(record, ["createdAt", "created_at"]) ?? undefined,
    updatedAt:
      readNullableString(record, ["updatedAt", "updated_at"]) ?? undefined,
    items,
    lead: normalizeQuotationLead(record.lead),
  };
}

export function normalizeQuotations(payload: unknown): Quotation[] {
  let records: unknown[] = [];

  if (Array.isArray(payload)) {
    records = payload;
  } else if (typeof payload === "object" && payload !== null) {
    const raw = payload as Record<string, unknown>;
    if (Array.isArray(raw.items)) {
      records = raw.items;
    } else if (raw.data && typeof raw.data === "object") {
      const dataObj = raw.data as Record<string, unknown>;
      if (Array.isArray(dataObj.items)) {
        records = dataObj.items;
      } else if (Array.isArray(raw.data)) {
        records = raw.data;
      }
    } else if (Array.isArray(raw.quotations)) {
      records = raw.quotations;
    } else if (Array.isArray(raw.results)) {
      records = raw.results;
    }
  }

  return records
    .filter(
      (record): record is Record<string, unknown> =>
        typeof record === "object" && record !== null,
    )
    .map((record, index) => normalizeQuotationRecord(record, index));
}

export function isQuotationUnavailableError(error: unknown) {
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

export function canCreateQuotation(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "SALES_MANAGER";
}

export function canApproveQuotation(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "SALES_MANAGER";
}

export function canRejectQuotation(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "SALES_MANAGER";
}

export function isAlreadyConvertedError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  return error.code === "ALREADY_CONVERTED" || error.statusCode === 409;
}

export function getQuotationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "INVALID_STATUS_TRANSITION":
        return "This quotation cannot transition to the requested status.";
      case "QUOTATION_LOCKED":
        return "Approved or converted quotations cannot be edited.";
      case "QUOTATION_REJECTED":
        return "Rejected quotations cannot be converted. Send for revision first.";
      case "ALREADY_CONVERTED":
        return "This quotation has already been converted to a project.";
      case "VALIDATION_ERROR":
        return error.message || "Please provide valid quotation data.";
      case "LEAD_NOT_FOUND":
        return "The selected lead could not be found.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

/**
 * Filter quotations locally (used for client-side search fallback and preview lists)
 */
export function filterQuotationsBySearch(
  quotations: Quotation[],
  searchTerm: string,
): Quotation[] {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) {
    return quotations;
  }

  return quotations.filter((quotation) => {
    const idMatch = quotation.id.toLowerCase().includes(normalized);
    const leadIdMatch = quotation.leadId.toLowerCase().includes(normalized);
    const customerNameMatch =
      quotation.lead?.customerName?.toLowerCase().includes(normalized) ?? false;
    const companyMatch =
      quotation.lead?.companyName?.toLowerCase().includes(normalized) ?? false;
    const notesMatch =
      quotation.notes?.toLowerCase().includes(normalized) ?? false;

    return (
      idMatch || leadIdMatch || customerNameMatch || companyMatch || notesMatch
    );
  });
}

/**
 * Slice quotations by page and compute pagination boundaries
 */
export function paginateQuotations(
  items: Quotation[],
  page: number,
  pageSize: number = 5,
): {
  items: Quotation[];
  total: number;
  page: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    total,
    page: currentPage,
    totalPages,
    startIndex: total > 0 ? startIndex + 1 : 0,
    endIndex,
  };
}
