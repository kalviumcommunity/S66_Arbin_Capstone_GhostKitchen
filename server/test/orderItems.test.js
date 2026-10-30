import assert from "node:assert/strict";
import { test } from "node:test";
import { getOrderItems } from "../../client/src/utils/orderItems.js";

test("order displays prefer original snapshots over renamed or deleted menu items", () => {
  const items = [{ foodId: "pasta", name: "Original pasta", quantity: 2, unitPrice: 10, lineTotal: 20 }];
  assert.deepEqual(getOrderItems({ items, foods: [{ _id: "pasta", name: "New pasta", price: 99 }] }), items);
  assert.deepEqual(getOrderItems({ items, foods: [] }), items);
});

test("legacy orders group quantities without pretending current menu prices are historical prices", () => {
  const food = { _id: "pasta", name: "Pasta", price: 99 };
  assert.deepEqual(getOrderItems({ foods: [food, null, food] }), [
    { foodId: "pasta", name: "Pasta", quantity: 2, unitPrice: null, lineTotal: null },
  ]);
});

test("missing and unpopulated legacy items are safe to display", () => {
  assert.deepEqual(getOrderItems(null), []);
  assert.deepEqual(getOrderItems({ foods: ["deleted-id"] }), [
    { foodId: "deleted-id", name: "Unavailable menu item", quantity: 1, unitPrice: null, lineTotal: null },
  ]);
});
