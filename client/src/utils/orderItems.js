// New orders use immutable snapshots. Historical prices cannot be reconstructed
// for legacy orders, so never present today's menu prices as purchase prices.
export function getOrderItems(order) {
  if (order?.items?.length) return order.items;
  const items = new Map();
  for (const food of order?.foods || []) {
    if (!food) continue;
    const id = typeof food === "string" ? food : food._id;
    const existing = items.get(id);
    if (existing) existing.quantity += food.quantity || 1;
    else items.set(id, {
      foodId: id, name: food.name || "Unavailable menu item", quantity: food.quantity || 1,
      unitPrice: null, lineTotal: null,
    });
  }
  return [...items.values()];
}
