import type { QuotationItemInput } from "@/types/quotation";
import {
  calculateLineItemAmount,
  calculateTotalAmount,
  round2,
} from "@/components/dashboard/quotations/quotationUtils";

/**
 * Service helpers for line item operations and calculations
 */
export function calculateItemTotal(
  quantity: number,
  unitPrice: number,
): number {
  return calculateLineItemAmount(quantity, unitPrice);
}

export function calculateQuotationGrandTotal(
  items: QuotationItemInput[],
): number {
  return calculateTotalAmount(items);
}

export function validateLineItems(items: QuotationItemInput[]): string | null {
  if (items.length === 0) {
    return "At least one item is required.";
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.itemName.trim()) {
      return `Item ${index + 1}: item name is required.`;
    }
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      return `Item ${index + 1}: quantity must be greater than zero.`;
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      return `Item ${index + 1}: unit price must be zero or greater.`;
    }
  }

  return null;
}

export function normalizeLineItems(
  items: QuotationItemInput[],
): QuotationItemInput[] {
  return items.map((item) => ({
    itemName: item.itemName.trim(),
    quantity: round2(Math.max(1, Number(item.quantity) || 1)),
    unitPrice: round2(Math.max(0, Number(item.unitPrice) || 0)),
  }));
}
