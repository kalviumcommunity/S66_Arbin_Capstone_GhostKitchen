import { createHash } from "node:crypto";
import mongoose from "mongoose";
import Food from "../models/foodModel.js";
import Order from "../models/orderModel.js";
import InventoryHistory from "../models/inventoryHistoryModel.js";
import { allowedOrderStatuses, ORDER_TRANSITIONS, OrderError } from "./orderPolicy.js";

const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

function normalizeRequest(user, body, key) {
  if (typeof key !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
    throw new OrderError(400, "Provide an Idempotency-Key header (8–128 letters, digits, underscores or hyphens).");
  }
  if (!Array.isArray(body.foods) || !body.foods.length || body.foods.length > 500) {
    throw new OrderError(400, "Provide between 1 and 500 food IDs.");
  }
  if (body.foods.some((id) => typeof id !== "string" || !mongoose.isObjectIdOrHexString(id))) {
    throw new OrderError(400, "One or more food IDs are invalid.");
  }
  for (const field of ["customerName", "phone", "address"]) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      throw new OrderError(400, `${field} must be a string.`);
    }
  }
  const request = {
    customerName: body.customerName?.trim() || user.username,
    phone: body.phone?.trim() || "",
    address: body.address?.trim() || "",
    foods: body.foods.map((id) => id.toLowerCase()).sort(),
  };
  return { request, requestHash: createHash("sha256").update(JSON.stringify(request)).digest("hex") };
}

function checkReplay(order, requestHash) {
  if (order.requestHash !== requestHash) {
    throw new OrderError(409, "This checkout key was already used for different order details. Start a new checkout.");
  }
  return { order, replayed: true };
}

export async function placeOrder(user, body, key) {
  const { request, requestHash } = normalizeRequest(user, body, key);
  // Ensure the unique index exists before accepting concurrent checkout requests.
  await Order.init();
  const filter = { userId: user._id, idempotencyKey: key };
  try {
    return await mongoose.connection.transaction(async (session) => {
      const existing = await Order.findOne(filter).select("+requestHash").session(session);
      if (existing) return checkReplay(existing, requestHash);

      const quantities = new Map();
      for (const id of request.foods) quantities.set(id, (quantities.get(id) || 0) + 1);
      const items = [];
      const histories = [];
      for (const [foodId, quantity] of quantities) {
        // The condition and decrement are a single write. Transaction retries re-check stock.
        const food = await Food.findOneAndUpdate(
          { _id: foodId, isAvailable: { $ne: false }, stockQuantity: { $gte: quantity } },
          { $inc: { stockQuantity: -quantity } },
          { session, new: true }
        );
        if (!food) throw new OrderError(409, "An item is unavailable or has insufficient stock. Review your cart.");
        if (food.stockQuantity === 0) {
          food.isAvailable = false;
          await food.save({ session });
        }
        const unitPrice = money(food.price);
        items.push({ foodId: food._id, name: food.name, unitPrice, quantity, lineTotal: money(unitPrice * quantity) });
        histories.push({
          foodId: food._id, changeType: "order_placed", previousStock: food.stockQuantity + quantity,
          quantityChange: -quantity, newStock: food.stockQuantity, updatedBy: user._id,
        });
      }
      const [order] = await Order.create([{
        ...request, userId: user._id, items, idempotencyKey: key, requestHash,
        totalPrice: money(items.reduce((total, item) => total + item.lineTotal, 0)),
      }], { session });
      await InventoryHistory.create(histories.map((history) => ({ ...history, orderId: order._id })), { session, ordered: true });
      return { order, replayed: false };
    });
  } catch (error) {
    // Two transactions can race on the unique key. The winner is the canonical order.
    if (error.code === 11000) {
      const existing = await Order.findOne(filter).select("+requestHash");
      if (existing) return checkReplay(existing, requestHash);
    }
    throw error;
  }
}

export async function changeOrderStatus(user, orderId, status) {
  if (!mongoose.isObjectIdOrHexString(orderId)) throw new OrderError(400, "Invalid order ID.");
  if (!Object.hasOwn(ORDER_TRANSITIONS, status)) {
    throw new OrderError(400, "Invalid order status.");
  }
  return mongoose.connection.transaction(async (session) => {
    const filter = { _id: orderId, ...(user.role === "owner" ? {} : { userId: user._id }) };
    const order = await Order.findOne(filter).session(session);
    if (!order) throw new OrderError(404, "Order not found.");
    // Retried cancellation/status requests are safe no-ops, never repeated inventory writes.
    if (status === order.status && (user.role === "owner" || status === "cancelled")) {
      return { order, changed: false };
    }
    if (!allowedOrderStatuses(order, user.role).includes(status)) {
      throw new OrderError(409, `Cannot move an order from ${order.status} to ${status}.`);
    }
    order.status = status;
    if (status === "cancelled" && !order.stockRestoredAt) {
      const quantities = new Map();
      // Legacy orders still use their original repeated food IDs for restoration.
      if (order.items?.length) {
        for (const item of order.items) quantities.set(String(item.foodId), item.quantity);
      } else {
        for (const id of order.foods) quantities.set(String(id), (quantities.get(String(id)) || 0) + 1);
      }
      for (const [foodId, quantity] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
        const food = await Food.findOneAndUpdate({ _id: foodId }, { $inc: { stockQuantity: quantity } }, { session, new: true });
        // Deleted menu items remain in the snapshot but no longer have inventory to restore.
        if (!food) continue;
        const previousStock = food.stockQuantity - quantity;
        if (previousStock === 0) {
          food.isAvailable = true;
          await food.save({ session });
        }
        await InventoryHistory.create([{
          foodId, changeType: "order_cancelled", previousStock, quantityChange: quantity,
          newStock: food.stockQuantity, updatedBy: user._id, orderId: order._id,
        }], { session });
      }
      order.stockRestoredAt = new Date();
    }
    await order.save({ session });
    return { order, changed: true };
  });
}
