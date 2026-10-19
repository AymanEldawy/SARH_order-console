import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateOrderTotal,
  formatOrderTotal,
} from "../src/features/orders/lib/orders.utils";
import { createOrderFormSchema } from "../src/features/orders/lib/orders.validation";

const validOrder = {
  customerName: "Noura Al-Shehri",
  customerEmail: "noura@example.com",
  items: [
    { id: "first-item", itemName: "Desk pad", quantity: 2, unitPrice: 29.5 },
  ],
};

describe("orders feature validation", () => {
  it("accepts an order with one to five valid items", () => {
    assert.equal(createOrderFormSchema.safeParse(validOrder).success, true);
    assert.equal(
      createOrderFormSchema.safeParse({
        ...validOrder,
        items: Array.from({ length: 5 }, (_, index) => ({
          ...validOrder.items[0],
          id: String(index),
        })),
      }).success,
      true,
    );
  });

  it("rejects empty item names, invalid quantities, and invalid prices", () => {
    for (const item of [
      { ...validOrder.items[0], itemName: " " },
      { ...validOrder.items[0], quantity: 0 },
      { ...validOrder.items[0], quantity: 1.5 },
      { ...validOrder.items[0], unitPrice: 0 },
      { ...validOrder.items[0], unitPrice: 1.999 },
    ]) {
      assert.equal(
        createOrderFormSchema.safeParse({ ...validOrder, items: [item] })
          .success,
        false,
      );
    }
  });

  it("enforces the minimum and maximum item count", () => {
    assert.equal(
      createOrderFormSchema.safeParse({ ...validOrder, items: [] }).success,
      false,
    );
    assert.equal(
      createOrderFormSchema.safeParse({
        ...validOrder,
        items: Array.from({ length: 6 }, (_, index) => ({
          ...validOrder.items[0],
          id: String(index),
        })),
      }).success,
      false,
    );
  });
});

describe("order total utilities", () => {
  it("calculates and formats totals using two-decimal monetary rounding", () => {
    assert.equal(
      calculateOrderTotal([
        { quantity: 1, unitPrice: 0.1 },
        { quantity: 1, unitPrice: 0.2 },
      ]),
      0.3,
    );
    assert.equal(
      calculateOrderTotal([{ quantity: 3, unitPrice: 19.995 }]),
      59.99,
    );
    assert.equal(formatOrderTotal(0.3), "0.30");
  });
});
