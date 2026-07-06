import { ApiError } from "@/lib/ApiError";
import type {
  Quotation,
  QuotationFormErrors,
  QuotationFormValues,
  QuotationItem,
  QuotationStatus,
} from "@/types/quotation";

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
    notes: "Client requested a revised quotation with a lower budget.",
    projectId: null,
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

function normalizeQuotationStatus(value: unknown): QuotationStatus {
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
      quantity * unitPrice,
    ),
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

function normalizeQuotationRecord(
  record: Record<string, unknown>,
  index: number,
): Quotation {
  const items = normalizeQuotationItems(record.items);
  const fallbackTotal = items.reduce((total, item) => total + item.amount, 0);

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
      "",
    ),
    status: normalizeQuotationStatus(record.status),
    totalAmount: readNumber(
      record,
      ["totalAmount", "total_amount", "total"],
      fallbackTotal,
    ),
    pdfUrl: readNullableString(record, ["pdfUrl", "pdf_url"]),
    notes: readNullableString(record, ["notes", "note"]),
    projectId: readNullableString(record, ["projectId", "project_id"]),
    items,
  };
}

export function normalizeQuotations(payload: unknown): Quotation[] {
  const records = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null
      ? ((payload as Record<string, unknown>).items ??
        (payload as Record<string, unknown>).quotations ??
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

// TODO: revisit once the backend team confirms the real JWT role string —
// this may be "SALES_MANAGER" rather than "MANAGER".
export function canCreateQuotation(role: string | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

// TODO: revisit once the backend team confirms the real JWT role string —
// this may be "SALES_MANAGER" rather than "MANAGER".
export function canApproveQuotation(role: string | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function isAlreadyConvertedError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  return error.code === "ALREADY_CONVERTED" || error.statusCode === 409;
}
