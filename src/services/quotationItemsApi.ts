import { validateItems } from "@/lib/quotationMoney";
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
  return validateItems(items);
}

export function normalizeLineItems(
  items: QuotationItemInput[],
): QuotationItemInput[] {
  return items.map((item) => ({
    itemName: item.itemName.trim(),
    quantity: Number(item.quantity),
    unitPrice: round2(Math.max(0, Number(item.unitPrice) || 0)),
  }));
}
