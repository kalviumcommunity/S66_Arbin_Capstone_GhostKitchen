import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { orderActions, OrderError } from "../services/orderPolicy.js";
import { receiptHTML } from "../services/receiptService.js";
import { verifySignature } from "../services/razorpayGateway.js";
import { route } from "../utils/validation.js";

export const paymentWebhook = route(async (req, res) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) throw new OrderError(503, "Payment webhooks are not configured.");
  if (!Buffer.isBuffer(req.body) || !verifySignature(req.body, req.get("x-razorpay-signature"), process.env.RAZORPAY_WEBHOOK_SECRET)) throw new OrderError(400, "Invalid webhook signature.");
  let body;
  try { body = JSON.parse(req.body.toString("utf8")); } catch { throw new OrderError(400, "Invalid webhook JSON."); }
  if (!body || typeof body !== "object" || typeof body.event !== "string") throw new OrderError(400, "Invalid webhook event.");
  try { await req.app.locals.payments.webhook(body); }
  catch (error) { if (error.status !== 404) throw error; }
  res.json({ received: true });
});

export function createPaymentRouter(payments) {
  const router = express.Router();
  router.get("/config", (req, res) => {
    let onlineEnabled = true;
    try { payments.gateway.assertConfigured(); } catch { onlineEnabled = false; }
    res.json({ onlineEnabled, cashOnDelivery: true, currency: "INR", mode: "test" });
  });
  // Use a scheduler bearer secret, never a public query parameter. Reconciliation is bounded per run.
  router.get("/maintenance", route(async (req, res) => {
    const supplied = req.get("Authorization")?.replace(/^Bearer /, "");
    const expected = process.env.PAYMENT_CRON_SECRET;
    if (!expected || !supplied || supplied !== expected) throw new OrderError(401, "Not authorized.");
    res.json(await payments.maintenance());
  }));
  router.use(protect, authorizeRoles("customer", "owner"));
  router.post("/maintenance", authorizeRoles("owner"), route(async (req, res) => res.json(await payments.maintenance())));
  router.post("/:id/start", route(async (req, res) => {
    const result = await payments.start(req.user, req.params.id);
    if (result.order) result.order = orderActions(result.order, req.user.role);
    res.json(result);
  }));
  router.post("/:id/verify", route(async (req, res) => res.json(orderActions(await payments.verify(req.user, req.params.id, req.body || {}), req.user.role))));
  router.post("/:id/reconcile", route(async (req, res) => res.json(orderActions(await payments.reconcile(req.user, req.params.id), req.user.role))));
  router.post("/:id/refund", authorizeRoles("owner"), route(async (req, res) => {
    const order = await payments.findOwned(req.user, req.params.id);
    if (order.status !== "cancelled" || order.paymentMethod !== "razorpay" || !["refund_pending", "refund_failed", "refunded"].includes(order.paymentStatus)) throw new OrderError(409, "This order is not eligible for a cancellation refund.");
    res.json(orderActions(await payments.refund(order._id), req.user.role));
  }));
  router.post("/:id/collect-cash", authorizeRoles("owner"), route(async (req, res) => res.json(orderActions(await payments.collectCash(req.user, req.params.id), req.user.role))));
  router.get("/:id/receipt", route(async (req, res) => {
    const order = await payments.findOwned(req.user, req.params.id);
    res.set({ "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="receipt-GK-${order._id}.html"`, "Cache-Control": "private, no-store", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" }).send(receiptHTML(order));
  }));
  return router;
}
