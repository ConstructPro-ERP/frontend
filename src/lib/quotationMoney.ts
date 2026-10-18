// Integer decimal arithmetic matches backend ROUND_HALF_UP without binary drift.
function scaledInteger(
  value: number,
  places: number,
  multiplier = 1,
): bigint | null {
  if (!Number.isFinite(value)) return null;
  const negative = value < 0;
  const [mantissa, exponent = "0"] = Math.abs(value)
    .toString()
    .toLowerCase()
    .split("e");
  const [whole, fraction = ""] = mantissa.split(".");
  const digits = BigInt(whole + fraction) * BigInt(multiplier);
  const shift = places + Number(exponent) - fraction.length;
  let result: bigint;
  if (shift >= 0) result = digits * BigInt(10) ** BigInt(shift);
  else {
    const divisor = BigInt(10) ** BigInt(-shift);
    result = (digits + divisor / BigInt(2)) / divisor;
  }
  return negative ? -result : result;
}

export const MAX_QUOTATION_AMOUNT = 9999999999.99;
export function roundMoney(value: number): number {
  const cents = scaledInteger(value, 2);
  return cents === null
    ? NaN
    : Number(cents / BigInt(100)) + Number(cents % BigInt(100)) / 100;
}
export function lineAmount(quantity: number, unitPrice: number): number {
  if (!Number.isSafeInteger(quantity)) return NaN;
  // Unit prices are validated to cents before submission.
  const cents = scaledInteger(unitPrice, 2, quantity);
  return cents === null
    ? NaN
    : Number(cents / BigInt(100)) + Number(cents % BigInt(100)) / 100;
}
export function totalAmount(
  items: Array<{ quantity: number; unitPrice: number }>,
): number {
  let cents = BigInt(0);
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity)) return NaN;
    const price = scaledInteger(item.unitPrice, 2, item.quantity);
    if (price === null) return NaN;
    cents += price;
  }
  return Number(cents / BigInt(100)) + Number(cents % BigInt(100)) / 100;
}
export function validateItems(
  items: Array<{ itemName: string; quantity: number; unitPrice: number }>,
): string | null {
  if (items.length === 0) return "At least one item is required.";
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const prefix = `Item ${index + 1}: `;
    if (!item.itemName.trim()) return prefix + "item name is required.";
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 2147483647
    )
      return (
        prefix +
        "quantity must be a positive whole number within the supported range."
      );
    if (
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0 ||
      item.unitPrice > MAX_QUOTATION_AMOUNT
    )
      return (
        prefix +
        "unit price must be zero or greater and within the supported range."
      );
    if (roundMoney(item.unitPrice) !== item.unitPrice)
      return prefix + "unit price must have at most two decimal places.";
    if (lineAmount(item.quantity, item.unitPrice) > MAX_QUOTATION_AMOUNT)
      return prefix + "line total exceeds the supported monetary range.";
  }
  if (totalAmount(items) > MAX_QUOTATION_AMOUNT)
    return "Quotation total exceeds the supported monetary range.";
  return null;
}
