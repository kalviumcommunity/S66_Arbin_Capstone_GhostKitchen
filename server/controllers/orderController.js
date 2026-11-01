import Order from "../models/orderModel.js";
import { emitToOwners, emitToUser } from "../socket/socketServer.js";
import { changeOrderStatus, placeOrder } from "../services/orderService.js";
import { orderActions } from "../services/orderPolicy.js";
import { paymentService } from "../services/paymentService.js";

function sendError(res, error, fallback) {
  if (error.status) return res.status(error.status).json({ message: error.message });
  if (error.name === "CastError" || error.name === "ValidationError") {
    return res.status(400).json({ message: "Invalid order data." });
  }
  if (error.code === 20 || error.codeName === "IllegalOperation") {
    return res.status(503).json({ message: "Ordering requires a MongoDB replica set. Please contact the kitchen." });
  }
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
}

export const getAllOrders = async (req, res) => {
  try {
    await (req.app.locals.payments || paymentService).expireUnpaid();
    const orders = await Order.find({ archivedAt: { $exists: false } }).populate("foods").sort({ createdAt: -1 });
    res.json(orders.map((order) => orderActions(order, req.user.role)));
  } catch (error) {
    sendError(res, error, "Failed to fetch orders");
  }
};

export const createOrder = async (req, res) => {
  try {
    const payments = req.app.locals.payments || paymentService;
    if (req.body?.paymentMethod === "razorpay") payments.gateway.assertConfigured();
    await payments.expireUnpaid();
    const { order, replayed } = await placeOrder(req.user, req.body || {}, req.get("Idempotency-Key"));
    await order.populate("foods");
    const customerOrder = orderActions(order, "customer");
    if (!replayed) {
      const ownerOrder = orderActions(order, "owner");
      emitToOwners("owner:order:new", { order: ownerOrder, message: `New order placed by ${order.customerName}` });
      emitToUser(order.userId, "customer:order:new", { order: customerOrder, message: "Your order has been placed" });
      emitToOwners("inventory:changed", { source: "order_placed", orderId: order._id, foodIds: order.items.map((item) => item.foodId) });
    }
    res.status(replayed ? 200 : 201).json(orderActions(order, req.user.role));
  } catch (error) {
    sendError(res, error, "Failed to create order");
  }
};

export const getMyOrders = async (req, res) => {
  try {
    await (req.app.locals.payments || paymentService).expireUnpaid();
    const orders = await Order.find({ userId: req.user._id }).populate("foods").sort({ createdAt: -1 });
    res.json(orders.map((order) => orderActions(order, "customer")));
  } catch (error) {
    sendError(res, error, "Failed to fetch your orders");
  }
};

export const getMyOrderById = async (req, res) => {
  try {
    await (req.app.locals.payments || paymentService).expireUnpaid();
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id }).populate("foods");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(orderActions(order, "customer"));
  } catch (error) {
    sendError(res, error, "Failed to fetch order");
  }
};

export const deleteOrder = async (req, res) => {
  try {
    // Archive terminal orders, retaining history and their duplicate-request keys.
    const deletedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ["completed", "cancelled"] } },
      { $set: { archivedAt: new Date() } }
    );
    if (!deletedOrder) {
      const exists = await Order.exists({ _id: req.params.id });
      return res.status(exists ? 409 : 404).json({ message: exists ? "Only completed or cancelled orders can be deleted." : "Order not found" });
    }
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    sendError(res, error, "Failed to delete order");
  }
};

async function handleStatusChange(req, res, status) {
  try {
    const result = await changeOrderStatus(req.user, req.params.id, status);
    let { order } = result;
    const { changed } = result;
    if (status === "cancelled" && ["refund_pending", "refund_failed"].includes(order.paymentStatus)) {
      order = await (req.app.locals.payments || paymentService).refund(order._id);
    }
    await order.populate("foods");
    if (changed) {
      emitToOwners("owner:order:updated", {
        order: orderActions(order, "owner"),
        message: `Order #${String(order._id).slice(-6).toUpperCase()} moved to ${order.status}`,
      });
      emitToUser(order.userId, "customer:order:updated", {
        order: orderActions(order, "customer"), message: `Your order status is now ${order.status}`,
      });
      if (status === "cancelled") {
        emitToOwners("inventory:changed", { source: "order_cancelled", orderId: order._id });
      }
    }
    res.json(orderActions(order, req.user.role));
  } catch (error) {
    sendError(res, error, "Failed to update order status");
  }
}

export const updateOrderStatus = (req, res) => handleStatusChange(req, res, req.body?.status);
export const cancelOrder = (req, res) => handleStatusChange(req, res, "cancelled");
