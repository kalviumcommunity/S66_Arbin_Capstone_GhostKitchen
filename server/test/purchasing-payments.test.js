import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { createHmac, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createApp } from "../app.js";
import User from "../models/userModel.js";
import Food from "../models/foodModel.js";
import Order from "../models/orderModel.js";
import Supplier from "../models/supplierModel.js";
import Ingredient from "../models/ingredientModel.js";
import IngredientHistory from "../models/ingredientHistoryModel.js";
import PurchaseOrder from "../models/purchaseOrderModel.js";
import InventoryHistory from "../models/inventoryHistoryModel.js";
import { changeOrderStatus } from "../services/orderService.js";
import { OrderError } from "../services/orderPolicy.js";
import { purchaseCSV } from "../services/procurementService.js";

function fakeGateway() {
  const orders = new Map(), payments = new Map(), refunds = new Map();
  let sequence = 0;
  return {
    orders, payments, refundRecords: refunds, orderCalls: 0, refundCalls: 0,
    enabled: true, orderTimeout: false, refundTimeout: false, failedRefund: false, refundPending: false,
    reset() { orders.clear(); payments.clear(); refunds.clear(); sequence = 0; this.orderCalls = 0; this.refundCalls = 0; this.enabled = true; this.orderTimeout = false; this.refundTimeout = false; this.failedRefund = false; this.refundPending = false; },
    assertConfigured() { if (!this.enabled) throw new OrderError(503, "Online payments are not configured."); },
    keyId() { return "rzp_test_disposable"; },
    async findOrder(receipt) { return [...orders.values()].find((order) => order.receipt === receipt); },
    async createOrder(body) {
      this.orderCalls++;
      const order = { ...body, id: `order_${++sequence}`, status: "created" };
      orders.set(order.id, order);
      if (this.orderTimeout) { this.orderTimeout = false; throw new OrderError(502, "Simulated order timeout"); }
      return order;
    },
    async fetchOrder(id) { return orders.get(id); },
    async fetchPayment(id) { return payments.get(id); },
    async orderPayments(id) { return [...payments.values()].filter((payment) => payment.order_id === id); },
    capture(orderId, overrides = {}) {
      const order = orders.get(orderId);
      const payment = { id: `pay_${++sequence}`, order_id: orderId, status: "captured", amount: order.amount, currency: "INR", ...overrides };
      payments.set(payment.id, payment);
      return payment;
    },
    async refunds(id) { return [...refunds.values()].filter((refund) => refund.payment_id === id); },
    async createRefund(paymentId, body) {
      this.refundCalls++;
      const previous = [...refunds.values()].find((refund) => refund.receipt === body.receipt);
      if (previous) return previous;
      const refund = { ...body, id: `rfnd_${++sequence}`, payment_id: paymentId, currency: "INR", status: this.failedRefund ? "failed" : this.refundPending ? "pending" : "processed" };
      refunds.set(refund.id, refund);
      if (this.refundTimeout) { this.refundTimeout = false; throw new OrderError(502, "Simulated refund timeout"); }
      return refund;
    },
    async fetchRefund(id) { return refunds.get(id); },
  };
}

let replica, server, app, base, customer, owner, stranger, pasta;
const gateway = fakeGateway();
const sig = (value, secret = process.env.RAZORPAY_KEY_SECRET) => createHmac("sha256", secret).update(value).digest("hex");

before(async () => {
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: "7.0.24" }, instanceOpts: [{ launchTimeout: 60000 }] });
  await mongoose.connect(replica.getUri());
  await Promise.all([User, Food, Order, Supplier, Ingredient, IngredientHistory, PurchaseOrder, InventoryHistory].map((model) => model.init()));
  process.env.JWT_SECRET = randomUUID();
  process.env.RAZORPAY_KEY_SECRET = "disposable-payment-secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "disposable-webhook-secret";
  process.env.PAYMENT_CRON_SECRET = "disposable-cron-secret";
  app = createApp({ gateway });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
}, { timeout: 240000 });

beforeEach(async () => {
  gateway.reset();
  await Promise.all([User, Food, Order, Supplier, Ingredient, IngredientHistory, PurchaseOrder, InventoryHistory].map((model) => model.deleteMany({})));
  [customer, owner, stranger] = await User.create([
    { username: "Customer", email: "customer@test.local", role: "customer" },
    { username: "Owner", email: "owner@test.local", role: "owner" },
    { username: "Stranger", email: "stranger@test.local", role: "customer" },
  ]);
  pasta = await Food.create({ name: "Pasta", price: 12.35, category: "veg", type: "main", stockQuantity: 20 });
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (replica) await replica.stop();
});

async function request(path, { method = "GET", user = owner, body, key, headers = {}, raw } = {}) {
  const response = await fetch(base + path, {
    method, headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${jwt.sign({ id: user._id }, process.env.JWT_SECRET)}` } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...headers },
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const contentType = response.headers.get("content-type") || "";
  return { status: response.status, headers: response.headers, data: contentType.includes("application/json") ? await response.json() : await response.text() };
}

async function checkout(method = "razorpay", extra = {}) {
  const result = await request("/orders", { method: "POST", user: customer, key: randomUUID(), body: { foods: [String(pasta._id), String(pasta._id)], paymentMethod: method, ...extra } });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  return result.data;
}
async function start(order) {
  const result = await request(`/payments/${order._id}/start`, { method: "POST", user: customer });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data;
}
async function paidOrder(extra = {}) {
  const order = await checkout("razorpay", extra);
  const remote = await start(order);
  const payment = gateway.capture(remote.gatewayOrderId);
  const result = await request(`/payments/${order._id}/verify`, { method: "POST", user: customer, body: { razorpay_order_id: remote.gatewayOrderId, razorpay_payment_id: payment.id, razorpay_signature: sig(`${remote.gatewayOrderId}|${payment.id}`) } });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data;
}
async function webhook(body, signature) {
  const raw = JSON.stringify(body);
  return request("/payments/webhook", { method: "POST", user: null, raw, headers: { "x-razorpay-signature": signature || sig(raw, process.env.RAZORPAY_WEBHOOK_SECRET) } });
}
async function procurementFixture(lines = 1) {
  const supplier = await Supplier.create({ name: "Weekly Supplier", email: "supplier@test.local" });
  const ingredients = await Ingredient.create(Array.from({ length: lines }, (_, index) => ({ name: index ? "Flour" : "Chicken", category: "Pantry", unit: "kg", lowStockThreshold: 2, supplierId: supplier._id })));
  const result = await request("/procurement/purchase-orders", { method: "POST", body: { supplierId: String(supplier._id), lines: ingredients.map((item) => ({ ingredientId: String(item._id), quantity: 10, unitPrice: 120.5 })) } });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  const submitted = await request(`/procurement/purchase-orders/${result.data._id}/status`, { method: "PATCH", body: { status: "ordered" } });
  assert.equal(submitted.status, 200);
  return { supplier, ingredients, order: submitted.data };
}

test("supplier CRUD is persistent and historical supplier names do not change", async () => {
  const created = await request("/procurement/suppliers", { method: "POST", body: { name: "Supplier One", email: "one@test.local" } });
  assert.equal(created.status, 201);
  const updated = await request(`/procurement/suppliers/${created.data._id}`, { method: "PUT", body: { name: "Supplier Two", phone: "123" } });
  assert.equal(updated.data.name, "Supplier Two");
  await request(`/procurement/suppliers/${created.data._id}`, { method: "DELETE" });
  assert.equal((await Supplier.findById(created.data._id)).active, false);
  const { supplier, order } = await procurementFixture();
  await Supplier.findByIdAndUpdate(supplier._id, { name: "Renamed Supplier" });
  assert.equal((await PurchaseOrder.findById(order._id)).supplierName, "Weekly Supplier");
});

test("procurement routes require owner access", async () => {
  assert.equal((await request("/procurement/ingredients", { user: null })).status, 401);
  for (const path of ["suppliers", "ingredients", "ingredients/history", "purchase-orders", "purchase-orders/export"]) {
    assert.equal((await request(`/procurement/${path}`, { user: customer })).status, 403);
  }
});

test("ingredient opening stock, usage, waste, thresholds and history support fractional kg", async () => {
  const created = await request("/procurement/ingredients", { method: "POST", body: { name: "Chicken", category: "Meat", unit: "kg", stockQuantity: 10, lowStockThreshold: 2 } });
  assert.equal(created.status, 201);
  const id = created.data._id;
  for (const [type, quantity] of [["usage", 7.5], ["waste", 0.75]]) {
    assert.equal((await request(`/procurement/ingredients/${id}/adjustments`, { method: "POST", key: randomUUID(), body: { type, quantity, note: "Weekly service" } })).status, 200);
  }
  const items = await request("/procurement/ingredients");
  assert.equal(items.data[0].stockQuantity, 1.75);
  assert.equal(items.data[0].lowStock, true);
  assert.equal((await request("/procurement/ingredients/history?days=7")).data.length, 3);
  assert.equal((await request("/procurement/ingredients/summary?days=7")).data[0].total, 8.25);
  assert.equal((await request(`/procurement/ingredients/${id}/adjustments`, { method: "POST", key: randomUUID(), body: { type: "usage", quantity: 2, note: "Too much" } })).status, 409);
  assert.equal((await Ingredient.findById(id)).stockQuantity, 1.75);
});

test("concurrent retried usage adjustments record one inventory movement", async () => {
  const ingredient = await Ingredient.create({ name: "Chicken", category: "Meat", unit: "kg", stockQuantity: 10, lowStockThreshold: 2 });
  const key = randomUUID();
  const results = await Promise.all(Array.from({ length: 5 }, () => request(`/procurement/ingredients/${ingredient._id}/adjustments`, { method: "POST", key, body: { type: "usage", quantity: 0.1, note: "Service" } })));
  assert.ok(results.every((result) => result.status === 200), JSON.stringify(results.map((result) => result.data)));
  assert.equal((await Ingredient.findById(ingredient._id)).stockQuantity, 9.9);
  assert.equal(await IngredientHistory.countDocuments(), 1);
  assert.equal((await request(`/procurement/ingredients/${ingredient._id}/adjustments`, { method: "POST", key, body: { type: "usage", quantity: 1, note: "Changed" } })).status, 409);
});

test("partial receiving increments only delivered ingredients and is retry-safe", async () => {
  const { order, ingredients } = await procurementFixture(2);
  const key = randomUUID();
  const path = `/procurement/purchase-orders/${order._id}/receive`;
  const body = { lines: [{ lineId: order.lines[0]._id, quantity: 4.25 }] };
  const results = await Promise.all(Array.from({ length: 4 }, () => request(path, { method: "POST", key, body })));
  assert.ok(results.every((result) => result.status === 200));
  assert.equal((await Ingredient.findById(ingredients[0]._id)).stockQuantity, 4.25);
  assert.equal((await Ingredient.findById(ingredients[1]._id)).stockQuantity, 0);
  assert.equal((await PurchaseOrder.findById(order._id)).status, "partially_received");
  assert.equal(await IngredientHistory.countDocuments(), 1);
  assert.equal((await request(path, { method: "POST", key, body: { lines: [{ lineId: order.lines[0]._id, quantity: 1 }] } })).status, 409);
  const completed = await request(path, { method: "POST", key: randomUUID(), body: { lines: [{ lineId: order.lines[0]._id, quantity: 5.75 }, { lineId: order.lines[1]._id, quantity: 10 }] } });
  assert.equal(completed.data.status, "received");
  assert.equal((await Ingredient.findById(ingredients[0]._id)).stockQuantity, 10);
});

test("competing deliveries cannot over-receive a purchase order", async () => {
  const { order, ingredients } = await procurementFixture();
  const results = await Promise.all(Array.from({ length: 2 }, () => request(`/procurement/purchase-orders/${order._id}/receive`, { method: "POST", key: randomUUID(), body: { lines: [{ lineId: order.lines[0]._id, quantity: 7 }] } })));
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal((await Ingredient.findById(ingredients[0]._id)).stockQuantity, 7);
});

test("receiving rolls back every ingredient and receipt when a later line fails", async () => {
  const { order, ingredients } = await procurementFixture(2);
  await Ingredient.findByIdAndUpdate(ingredients[1]._id, { active: false });
  const result = await request(`/procurement/purchase-orders/${order._id}/receive`, { method: "POST", key: randomUUID(), body: { lines: order.lines.map((line) => ({ lineId: line._id, quantity: 1 })) } });
  assert.equal(result.status, 409);
  assert.equal((await Ingredient.findById(ingredients[0]._id)).stockQuantity, 0);
  assert.equal(await IngredientHistory.countDocuments(), 0);
  assert.equal((await PurchaseOrder.findById(order._id)).receipts.length, 0);
});

test("cancelling remaining purchasing quantities keeps stock already received", async () => {
  const { order, ingredients } = await procurementFixture();
  const path = `/procurement/purchase-orders/${order._id}`;
  await request(`${path}/receive`, { method: "POST", key: randomUUID(), body: { lines: [{ lineId: order.lines[0]._id, quantity: 3 }] } });
  assert.equal((await request(`${path}/status`, { method: "PATCH", body: { status: "cancelled" } })).status, 200);
  assert.equal((await Ingredient.findById(ingredients[0]._id)).stockQuantity, 3);
  assert.equal((await request(`${path}/receive`, { method: "POST", key: randomUUID(), body: { lines: [{ lineId: order.lines[0]._id, quantity: 1 }] } })).status, 409);
});

test("ingredient units and active purchases protect stock records from invalid edits", async () => {
  const { ingredients } = await procurementFixture();
  const item = ingredients[0];
  assert.equal((await request(`/procurement/ingredients/${item._id}`, { method: "DELETE" })).status, 409);
  assert.equal((await request(`/procurement/ingredients/${item._id}`, { method: "PUT", body: { name: item.name, category: item.category, unit: "g", lowStockThreshold: 2 } })).status, 400);
  assert.equal((await request("/procurement/ingredients", { method: "POST", body: { name: "Bad", category: "Meat", unit: "kg", stockQuantity: -1, lowStockThreshold: 0 } })).status, 400);
});

test("purchase orders can be edited before submission and snapshot decimal pricing", async () => {
  const supplier = await Supplier.create({ name: "Supplier" });
  const item = await Ingredient.create({ name: "Chicken", category: "Meat", unit: "kg", lowStockThreshold: 1 });
  const body = { supplierId: String(supplier._id), lines: [{ ingredientId: String(item._id), quantity: 0.5, unitPrice: 123.45 }] };
  const created = await request("/procurement/purchase-orders", { method: "POST", body });
  assert.equal(created.status, 201);
  assert.equal(created.data.totalPaise, 6173);
  const edited = await request(`/procurement/purchase-orders/${created.data._id}`, { method: "PUT", body: { ...body, notes: "Friday" } });
  assert.equal(edited.data.notes, "Friday");
  await request(`/procurement/purchase-orders/${created.data._id}/status`, { method: "PATCH", body: { status: "ordered" } });
  assert.equal((await request(`/procurement/purchase-orders/${created.data._id}`, { method: "PUT", body })).status, 409);
});

test("CSV export quotes fields and neutralizes spreadsheet formula injection", async () => {
  const csv = purchaseCSV([{ _id: "id", createdAt: new Date(), supplierName: '=HYPERLINK("bad")', status: "pending", lines: [{ name: "Chicken, fresh", unit: "kg", quantity: 1, receivedQuantity: 0, unitPricePaise: 1234, lineTotalPaise: 1234 }] }]);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"Chicken, fresh"'));
  const result = await request("/procurement/purchase-orders/export");
  assert.equal(result.status, 200);
  assert.ok(result.headers.get("content-disposition").includes("purchase-orders.csv"));
});

test("COD checkout stays unpaid until an owner records cash for ready/completed orders", async () => {
  const order = await checkout("cod");
  assert.equal(order.paymentStatus, "unpaid");
  assert.equal((await request(`/payments/${order._id}/collect-cash`, { method: "POST", user: customer })).status, 403);
  assert.equal((await request(`/payments/${order._id}/collect-cash`, { method: "POST" })).status, 409);
  await changeOrderStatus(owner, order._id, "preparing");
  await changeOrderStatus(owner, order._id, "ready");
  assert.equal((await request(`/payments/${order._id}/collect-cash`, { method: "POST" })).data.paymentStatus, "paid");
  assert.equal((await request(`/payments/${order._id}/collect-cash`, { method: "POST" })).data.paymentStatus, "paid");
  assert.equal(gateway.orderCalls, 0);
});

test("server calculates paise and unpaid online orders cannot enter preparation", async () => {
  const order = await checkout("razorpay", { totalPrice: 1, paymentStatus: "paid" });
  assert.equal(order.paymentStatus, "pending");
  assert.equal(order.payment.amountPaise, 2470);
  assert.deepEqual(order.allowedStatuses, ["cancelled"]);
  assert.equal((await request(`/orders/${order._id}/status`, { method: "PATCH", body: { status: "preparing" } })).status, 409);
  const remote = await start(order);
  assert.equal(remote.amount, 2470);
  await start(order);
  assert.equal(gateway.orderCalls, 1);
});

test("gateway order initialization recovers safely after an uncertain provider response", async () => {
  const order = await checkout();
  gateway.orderTimeout = true;
  assert.equal((await request(`/payments/${order._id}/start`, { method: "POST", user: customer })).status, 502);
  await start(order);
  assert.equal(gateway.orderCalls, 1);
});

test("a captured webhook recovers the local order before its gateway ID was persisted", async () => {
  const order = await checkout();
  gateway.orderTimeout = true;
  await request(`/payments/${order._id}/start`, { method: "POST", user: customer });
  const remote = [...gateway.orders.values()][0];
  const payment = gateway.capture(remote.id);
  const result = await webhook({ event: "payment.captured", payload: { payment: { entity: { id: payment.id } } } });
  assert.equal(result.status, 200);
  const stored = await Order.findById(order._id);
  assert.equal(stored.payment.gatewayOrderId, remote.id);
  assert.equal(stored.paymentStatus, "paid");
  assert.equal((await start(order)).alreadyPaid, true);
  assert.equal(gateway.orderCalls, 1);
});

test("signature and captured status are both required; amount and ownership are checked", async () => {
  const order = await checkout();
  const remote = await start(order);
  const payment = gateway.capture(remote.gatewayOrderId, { status: "authorized" });
  const body = { razorpay_order_id: remote.gatewayOrderId, razorpay_payment_id: payment.id, razorpay_signature: sig(`${remote.gatewayOrderId}|${payment.id}`) };
  assert.equal((await request(`/payments/${order._id}/verify`, { method: "POST", user: customer, body: { ...body, razorpay_signature: "bad" } })).status, 400);
  assert.equal((await request(`/payments/${order._id}/verify`, { method: "POST", user: stranger, body })).status, 404);
  assert.equal((await request(`/payments/${order._id}/verify`, { method: "POST", user: customer, body })).status, 409);
  payment.status = "captured"; payment.amount = 1;
  assert.equal((await request(`/payments/${order._id}/verify`, { method: "POST", user: customer, body })).status, 409);
  assert.equal((await Order.findById(order._id)).paymentStatus, "pending");
});

test("captured payment enables fulfillment and is idempotent across callback and duplicate webhooks", async () => {
  const order = await paidOrder();
  assert.equal(order.paymentStatus, "paid");
  const body = { event: "payment.captured", payload: { payment: { entity: { id: order.payment.paymentId } } } };
  assert.equal((await webhook(body)).status, 200);
  assert.equal((await webhook(body)).status, 200);
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 18);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await request(`/orders/${order._id}/status`, { method: "PATCH", body: { status: "preparing" } })).status, 200);
});

test("webhooks reject modified bytes and failure attempts do not cancel retriable checkout", async () => {
  const order = await checkout();
  await start(order);
  assert.equal((await webhook({ event: "payment.captured" }, "0".repeat(64))).status, 400);
  assert.equal((await webhook({ event: "payment.failed", payload: {} })).status, 200);
  assert.equal((await Order.findById(order._id)).status, "pending");
});

test("paid pending cancellation refunds the full amount and restores portions once", async () => {
  const order = await paidOrder();
  const results = await Promise.all(Array.from({ length: 4 }, () => request(`/orders/${order._id}/cancel`, { method: "PATCH", user: customer })));
  assert.ok(results.every((result) => result.status === 200));
  const stored = await Order.findById(order._id);
  assert.equal(stored.paymentStatus, "refunded");
  assert.equal(stored.payment.refundAmountPaise, 2470);
  assert.equal(gateway.refundCalls, 1);
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 20);
  assert.equal(await InventoryHistory.countDocuments({ changeType: "order_cancelled" }), 1);
});

test("uncertain refund results reconcile without sending a second refund", async () => {
  const order = await paidOrder();
  gateway.refundTimeout = true;
  const cancelled = await request(`/orders/${order._id}/cancel`, { method: "PATCH", user: customer });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.paymentStatus, "refund_failed");
  const retried = await request(`/payments/${order._id}/refund`, { method: "POST" });
  assert.equal(retried.data.paymentStatus, "refunded");
  assert.equal(gateway.refundCalls, 1);
});

test("pending refunds remain pending until the provider confirms processing", async () => {
  const order = await paidOrder();
  gateway.refundPending = true;
  const cancelled = await request(`/orders/${order._id}/cancel`, { method: "PATCH", user: customer });
  assert.equal(cancelled.data.paymentStatus, "refund_pending");
  assert.equal(cancelled.data.payment.refundAmountPaise, 2470);
  const refund = gateway.refundRecords.get(cancelled.data.payment.refundId);
  refund.status = "processed";
  assert.equal((await webhook({ event: "refund.processed", payload: { refund: { entity: { id: refund.id } } } })).status, 200);
  assert.equal((await Order.findById(order._id)).paymentStatus, "refunded");
  assert.equal(gateway.refundCalls, 1);
});

test("owner can retry a definitively failed refund using a new attempt receipt", async () => {
  const order = await paidOrder();
  gateway.failedRefund = true;
  const cancelled = await request(`/orders/${order._id}/cancel`, { method: "PATCH", user: customer });
  assert.equal(cancelled.data.paymentStatus, "refund_failed");
  assert.equal((await request(`/payments/${order._id}/refund`, { method: "POST", user: customer })).status, 403);
  gateway.failedRefund = false;
  const retried = await request(`/payments/${order._id}/refund`, { method: "POST" });
  assert.equal(retried.data.paymentStatus, "refunded");
  assert.equal(gateway.refundCalls, 2);
  assert.equal(new Set([...gateway.refundRecords.values()].map((refund) => refund.receipt)).size, 2);
});

test("expired reservations release stock and a late captured payment is fully refunded", async () => {
  const order = await checkout();
  const remote = await start(order);
  await Order.findByIdAndUpdate(order._id, { paymentExpiresAt: new Date(Date.now() - 1000) });
  await app.locals.payments.expireUnpaid();
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 20);
  const payment = gateway.capture(remote.gatewayOrderId);
  const result = await webhook({ event: "payment.captured", payload: { payment: { entity: { id: payment.id } } } });
  assert.equal(result.status, 200);
  const stored = await Order.findById(order._id);
  assert.equal(stored.status, "cancelled");
  assert.equal(stored.paymentStatus, "refunded");
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 20);
});

test("capture arriving after the deadline cancels and refunds even before the scheduler runs", async () => {
  const order = await checkout();
  const remote = await start(order);
  await Order.findByIdAndUpdate(order._id, { paymentExpiresAt: new Date(Date.now() - 1000) });
  const payment = gateway.capture(remote.gatewayOrderId);
  await webhook({ event: "order.paid", payload: { payment: { entity: { id: payment.id } } } });
  const stored = await Order.findById(order._id);
  assert.equal(stored.paymentStatus, "refunded");
  assert.equal(stored.status, "cancelled");
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 20);
});

test("out-of-order capture/refund webhooks never downgrade a completed refund", async () => {
  const order = await paidOrder();
  await request(`/orders/${order._id}/cancel`, { method: "PATCH", user: customer });
  const stored = await Order.findById(order._id);
  const refund = gateway.refundRecords.get(stored.payment.refundId);
  refund.status = "pending";
  await webhook({ event: "refund.created", payload: { refund: { entity: { id: refund.id } } } });
  await webhook({ event: "payment.captured", payload: { payment: { entity: { id: order.payment.paymentId } } } });
  assert.equal((await Order.findById(order._id)).paymentStatus, "refunded");
  assert.equal(gateway.refundCalls, 1);
});

test("receipts are authorized, escape customer content and preserve purchase prices", async () => {
  const order = await paidOrder({ customerName: "<script>bad</script>", address: "<img src=x>" });
  await Food.findByIdAndUpdate(pasta._id, { name: "Renamed", price: 99 });
  assert.equal((await request(`/payments/${order._id}/receipt`, { user: stranger })).status, 404);
  const receipt = await request(`/payments/${order._id}/receipt`, { user: customer });
  assert.equal(receipt.status, 200);
  assert.ok(receipt.data.includes("Pasta"));
  assert.ok(receipt.data.includes("INR 12.35"));
  assert.ok(!receipt.data.includes("INR 99.00"));
  assert.ok(receipt.data.includes("&lt;script&gt;bad&lt;/script&gt;"));
  assert.ok(!receipt.data.includes("<script>"));
  assert.ok(receipt.headers.get("content-disposition").includes(".html"));
  const unpaid = await checkout("cod");
  assert.equal((await request(`/payments/${unpaid._id}/receipt`, { user: customer })).status, 409);
});

test("maintenance is authenticated and reconciles missed captured-payment webhooks", async () => {
  const order = await checkout();
  const remote = await start(order);
  gateway.capture(remote.gatewayOrderId);
  assert.equal((await request("/payments/maintenance", { user: null })).status, 401);
  assert.equal((await request("/payments/maintenance", { user: customer, method: "POST" })).status, 403);
  const result = await request("/payments/maintenance", { user: null, headers: { Authorization: `Bearer ${process.env.PAYMENT_CRON_SECRET}` } });
  assert.equal(result.status, 200);
  assert.equal((await Order.findById(order._id)).paymentStatus, "paid");
});

test("unconfigured online checkout fails before reserving stock while COD remains available", async () => {
  gateway.enabled = false;
  const config = await request("/payments/config", { user: null });
  assert.equal(config.data.onlineEnabled, false);
  assert.equal((await request("/orders", { method: "POST", user: customer, key: randomUUID(), body: { foods: [String(pasta._id)], paymentMethod: "razorpay" } })).status, 503);
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 20);
  await checkout("cod");
});
