import type { OrderFormItem } from "../types/orders.types";

/** Rounds a number to the monetary precision accepted by the orders API. */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateOrderTotal(items: ReadonlyArray<Pick<OrderFormItem, "quantity" | "unitPrice">>): number {
  return roundCurrency(
    items.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
  );
}

export function formatOrderTotal(total: number): string {
  return calculateOrderTotal([{ quantity: 1, unitPrice: total }]).toFixed(2);
}
