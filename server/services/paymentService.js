import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import { cancelWithinTransaction, changeOrderStatus } from "./orderService.js";
import { OrderError } from "./orderPolicy.js";
import { publishOrder } from "./orderEvents.js";
import { razorpayGateway, verifySignature } from "./razorpayGateway.js";
import { objectId, toPaise } from "../utils/validation.js";

const amountOf = (order) => order.payment?.amountPaise ?? toPaise(order.totalPrice);
const lockFilter = (name) => ({ $or: [{ [`payment.${name}Until`]: { $exists: false } }, { [`payment.${name}Until`]: { $lte: new Date() } }] });
const gatewayId = (value, prefix) => typeof value === "string" && new RegExp(`^${prefix}_[A-Za-z0-9]+$`).test(value);

export function createPaymentService(gateway = razorpayGateway) {
  async function findOwned(user, id) {
    const order = await Order.findOne({ _id: objectId(id, "order ID"), ...(user.role === "owner" ? {} : { userId: user._id }) });
    if (!order) throw new OrderError(404, "Order not found.");
    return order;
  }

  async function expireUnpaid(limit = 50) {
    const expired = await Order.find({ paymentMethod: "razorpay", paymentStatus: "pending", status: "pending", paymentExpiresAt: { $lte: new Date() } }).limit(limit);
    let count = 0;
    for (const order of expired) {
      const result = await changeOrderStatus({ role: "owner", _id: order.userId }, order._id, "cancelled", { expireOnly: true });
      if (result.changed) { await publishOrder(result.order, "Unpaid checkout expired; reserved stock released"); count++; }
    }
    return count;
  }

  async function start(user, id) {
    gateway.assertConfigured();
    await expireUnpaid();
    const order = await findOwned(user, id);
    if (order.paymentMethod !== "razorpay" || order.status !== "pending") throw new OrderError(409, "This order cannot start online payment.");
    if (order.paymentStatus === "paid") return { alreadyPaid: true, order };
    if (order.paymentStatus !== "pending") throw new OrderError(409, "This payment is no longer open.");
    const response = (value) => ({ keyId: gateway.keyId(), gatewayOrderId: value.payment.gatewayOrderId, amount: amountOf(value), currency: "INR", expiresAt: value.paymentExpiresAt });
    if (order.payment.gatewayOrderId) return response(order);
    const token = randomUUID();
    const claimed = await Order.findOneAndUpdate({ _id: order._id, status: "pending", paymentStatus: "pending", ...lockFilter("checkoutLock") }, {
      $set: { "payment.checkoutLock": token, "payment.checkoutLockUntil": new Date(Date.now() + 30000) },
    }, { new: true });
    if (!claimed) throw new OrderError(409, "Payment initialization is already in progress. Retry shortly.");
    try {
      const receipt = `gk_${order._id}`;
      const remote = await gateway.findOrder(receipt) || await gateway.createOrder({ amount: amountOf(order), currency: "INR", receipt, notes: { ghostOrderId: String(order._id) } });
      if (!gatewayId(remote.id, "order") || remote.amount !== amountOf(order) || remote.currency !== "INR" || remote.receipt !== receipt) throw new OrderError(502, "Payment provider order details do not match checkout.");
      const saved = await Order.findOneAndUpdate({ _id: order._id, "payment.checkoutLock": token }, { $set: { "payment.gatewayOrderId": remote.id } }, { new: true });
      if (!saved || saved.status !== "pending") throw new OrderError(409, "The order was cancelled while payment was being initialized.");
      if (saved.paymentStatus === "paid") return { alreadyPaid: true, order: saved };
      return response(saved);
    } finally {
      await Order.updateOne({ _id: order._id, "payment.checkoutLock": token }, { $unset: { "payment.checkoutLock": 1, "payment.checkoutLockUntil": 1 } });
    }
  }

  async function applyRefund(id, refund) {
    const result = await mongoose.connection.transaction(async (session) => {
      const order = await Order.findById(id).session(session);
      if (!order || order.status !== "cancelled" || refund.payment_id !== order.payment.paymentId || refund.amount !== amountOf(order) || refund.currency !== "INR") throw new OrderError(409, "Refund details do not match the cancelled order.");
      if (order.paymentStatus === "refunded") return order;
      if (refund.status !== "processed" && order.payment.refundId && order.payment.refundId !== refund.id && refund.receipt !== order.payment.refundReceipt) return order;
      if (!["pending", "processed", "failed"].includes(refund.status)) throw new OrderError(502, "Unknown refund status.");
      order.payment.refundId = refund.id;
      order.payment.refundStatus = refund.status;
      order.payment.refundAmountPaise = refund.amount;
      order.payment.refundError = refund.status === "failed" ? "The provider reported a failed refund. Owner retry is available." : undefined;
      order.paymentStatus = refund.status === "processed" ? "refunded" : refund.status === "failed" ? "refund_failed" : "refund_pending";
      await order.save({ session });
      return order;
    });
    await publishOrder(result, "Refund status updated");
    return result;
  }

  async function refund(id) {
    const token = randomUUID();
    const order = await Order.findOneAndUpdate({ _id: id, status: "cancelled", paymentMethod: "razorpay", paymentStatus: { $in: ["refund_pending", "refund_failed"] }, "payment.paymentId": { $exists: true }, ...lockFilter("refundLock") }, {
      $set: { "payment.refundLock": token, "payment.refundLockUntil": new Date(Date.now() + 60000) },
    }, { new: true });
    if (!order) return Order.findById(id);
    try {
      gateway.assertConfigured();
      // Recover a remote result after a network timeout before considering a new refund.
      const existing = await gateway.refunds(order.payment.paymentId);
      const fullRefund = existing.find((item) => item.amount === amountOf(order) && item.currency === "INR" && ["pending", "processed"].includes(item.status));
      if (fullRefund) return await applyRefund(id, fullRefund);
      if (existing.some((item) => ["pending", "processed"].includes(item.status))) throw new OrderError(409, "A separate partial refund exists. Reconcile it with Razorpay before retrying.");
      let attempt = order.payment.refundAttempt || 0;
      let receipt = order.payment.refundReceipt || `gkr_${order._id}_${attempt}`;
      if (existing.some((item) => item.receipt === receipt && item.status === "failed")) {
        attempt++;
        receipt = `gkr_${order._id}_${attempt}`;
      }
      await Order.updateOne({ _id: id, "payment.refundLock": token }, { $set: {
        "payment.refundReceipt": receipt, "payment.refundAttempt": attempt, "payment.refundStatus": "requested", paymentStatus: "refund_pending",
      } });
      // Razorpay treats receipt as a refund idempotency key; it stays stable on uncertain retries.
      const remote = await gateway.createRefund(order.payment.paymentId, { amount: amountOf(order), speed: "normal", receipt, notes: { ghostOrderId: String(order._id) } });
      return await applyRefund(id, remote);
    } catch (error) {
      await Order.updateOne({ _id: id, "payment.refundLock": token, paymentStatus: { $ne: "refunded" } }, { $set: {
        paymentStatus: "refund_failed", "payment.refundError": error.status ? error.message : "Refund needs reconciliation. Retry from the owner workspace.",
      } });
      const latest = await Order.findById(id);
      await publishOrder(latest, "Refund requires attention");
      return latest;
    } finally {
      await Order.updateOne({ _id: id, "payment.refundLock": token }, { $unset: { "payment.refundLock": 1, "payment.refundLockUntil": 1 } });
    }
  }

  async function captured(payment) {
    if (!gatewayId(payment.id, "pay") || !gatewayId(payment.order_id, "order") || payment.status !== "captured") throw new OrderError(409, "Payment has not been captured. Please check again shortly.");
    let order = await Order.findOne({ "payment.gatewayOrderId": payment.order_id });
    if (!order) {
      // A signed webhook can arrive before checkout initialization persists its gateway ID.
      const remote = await gateway.fetchOrder(payment.order_id);
      const localId = remote.notes?.ghostOrderId;
      if (typeof localId !== "string" || !mongoose.isObjectIdOrHexString(localId) || remote.receipt !== `gk_${localId}`) throw new OrderError(404, "Payment does not belong to a Ghost Kitchen order.");
      order = await Order.findById(localId);
    }
    if (!order || order.paymentMethod !== "razorpay" || payment.currency !== "INR" || payment.amount !== amountOf(order)) throw new OrderError(409, "Payment amount or currency does not match the order.");
    const result = await mongoose.connection.transaction(async (session) => {
      const current = await Order.findById(order._id).session(session);
      if ((current.payment.paymentId && current.payment.paymentId !== payment.id) || (current.payment.gatewayOrderId && current.payment.gatewayOrderId !== payment.order_id)) throw new OrderError(409, "Payment belongs to a different checkout.");
      if (current.payment.paidAt) return { order: current, changed: false };
      if (current.status === "pending" && current.paymentExpiresAt <= new Date()) await cancelWithinTransaction(current, { _id: current.userId }, session, "payment_timeout");
      current.payment.gatewayOrderId = payment.order_id;
      current.payment.paymentId = payment.id;
      current.payment.paidAt = new Date();
      current.paymentStatus = current.status === "cancelled" ? "refund_pending" : "paid";
      if (current.status === "cancelled") {
        current.payment.refundStatus = "requested";
        current.payment.refundAmountPaise = amountOf(current);
      }
      await current.save({ session });
      return { order: current, changed: true };
    });
    if (result.changed) await publishOrder(result.order, result.order.status === "cancelled" ? "Late payment received; full refund requested" : "Online payment confirmed");
    if (["refund_pending", "refund_failed"].includes(result.order.paymentStatus)) return refund(result.order._id);
    return result.order;
  }

  async function verify(user, id, body) {
    const order = await findOwned(user, id);
    const paymentId = body.razorpay_payment_id;
    if (!gatewayId(paymentId, "pay") || !order.payment?.gatewayOrderId || body.razorpay_order_id !== order.payment.gatewayOrderId ||
      !verifySignature(`${order.payment.gatewayOrderId}|${paymentId}`, body.razorpay_signature, process.env.RAZORPAY_KEY_SECRET)) throw new OrderError(400, "Invalid payment signature.");
    return captured(await gateway.fetchPayment(paymentId));
  }

  async function reconcile(user, id) {
    let order = await findOwned(user, id);
    if (order.paymentMethod === "razorpay" && order.payment.gatewayOrderId && !order.payment.paidAt) {
      const payments = await gateway.orderPayments(order.payment.gatewayOrderId);
      const paid = payments.find((payment) => payment.status === "captured");
      if (paid) order = await captured(await gateway.fetchPayment(paid.id));
    }
    if (order.paymentStatus === "refund_pending" || order.paymentStatus === "refund_failed") order = await refund(order._id);
    return order;
  }

  async function collectCash(user, id) {
    const order = await findOwned(user, id);
    if (user.role !== "owner") throw new OrderError(403, "Only owners can record cash collection.");
    const updated = await Order.findOneAndUpdate({ _id: order._id, paymentMethod: "cod", status: { $in: ["ready", "completed"] }, paymentStatus: "unpaid" }, {
      $set: { paymentStatus: "paid", "payment.paidAt": new Date(), "payment.amountPaise": amountOf(order), "payment.collectedBy": user._id },
    }, { new: true });
    if (!updated) {
      const latest = await Order.findById(order._id);
      if (latest.paymentMethod === "cod" && latest.paymentStatus === "paid") return latest;
      throw new OrderError(409, "Cash can be recorded only for an unpaid ready or completed COD order.");
    }
    await publishOrder(updated, "Cash payment recorded");
    return updated;
  }

  async function webhook(body) {
    const payment = body.payload?.payment?.entity;
    if (["payment.captured", "order.paid"].includes(body.event) && payment?.id) return captured(await gateway.fetchPayment(payment.id));
    const entity = body.payload?.refund?.entity;
    if (["refund.created", "refund.processed", "refund.failed"].includes(body.event) && gatewayId(entity?.id, "rfnd")) {
      const remote = await gateway.fetchRefund(entity.id);
      const order = await Order.findOne({ "payment.paymentId": remote.payment_id });
      if (!order) throw new OrderError(404, "Refund does not belong to a Ghost Kitchen order.");
      return applyRefund(order._id, remote);
    }
    // payment.failed is an attempt failure, not a terminal order failure; checkout may be retried.
    return null;
  }

  async function maintenance() {
    const started = Date.now();
    const expired = await expireUnpaid();
    const candidates = await Order.find({ paymentMethod: "razorpay", $or: [
      { paymentStatus: { $in: ["refund_pending", "refund_failed"] } },
      { paymentStatus: { $in: ["pending", "unpaid"] }, "payment.gatewayOrderId": { $exists: true } },
    ] }).sort({ "payment.reconciledAt": 1, updatedAt: 1 }).limit(25);
    let reconciled = 0;
    for (const order of candidates) {
      if (Date.now() - started > 20000) break;
      try {
        await reconcile({ role: "owner" }, String(order._id));
        await Order.updateOne({ _id: order._id }, { $set: { "payment.reconciledAt": new Date() } });
        reconciled++;
      } catch (error) { console.error("Payment reconciliation failed", String(order._id), error.status || 500); }
    }
    return { expired, reconciled, attempted: candidates.length };
  }

  return { gateway, findOwned, start, verify, captured, refund, reconcile, collectCash, webhook, expireUnpaid, maintenance };
}

export const paymentService = createPaymentService();
