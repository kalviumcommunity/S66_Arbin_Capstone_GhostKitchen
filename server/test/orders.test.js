import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Food from "../models/foodModel.js";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import InventoryHistory from "../models/inventoryHistoryModel.js";
import orderRoutes from "../routes/orderRoutes.js";
import { placeOrder, changeOrderStatus } from "../services/orderService.js";

let replicaSet, server, baseURL, customer, owner, stranger;
const food = (overrides = {}) => Food.create({ name: "Pasta", price: 12.35, category: "veg", type: "main", stockQuantity: 10, ...overrides });
const payload = (...foods) => ({ foods: foods.map((item) => String(item._id)), phone: "1234567890", address: "12 Main St" });
const place = (body, key = randomUUID(), user = customer) => placeOrder(user, body, key);

before(async () => {
  // A disposable replica set exercises real MongoDB transactions, never the app's .env database.
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 }, binary: { version: "7.0.24" },
    instanceOpts: [{ launchTimeout: 60000 }],
  });
  await mongoose.connect(replicaSet.getUri());
  await Promise.all([Food.init(), Order.init(), User.init(), InventoryHistory.init()]);
  process.env.JWT_SECRET = randomUUID();
  const app = express();
  app.use(express.json());
  app.use("/api/orders", orderRoutes);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseURL = `http://127.0.0.1:${server.address().port}/api/orders`;
}, { timeout: 240000 });

beforeEach(async () => {
  await Promise.all([Order.deleteMany({}), Food.deleteMany({}), InventoryHistory.deleteMany({}), User.deleteMany({})]);
  [customer, owner, stranger] = await User.create([
    { username: "Customer", email: "customer@test.local", role: "customer" },
    { username: "Owner", email: "owner@test.local", role: "owner" },
    { username: "Stranger", email: "stranger@test.local", role: "customer" },
  ]);
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (replicaSet) await replicaSet.stop();
});

async function request(path, { user = customer, method = "GET", body, key } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (user) headers.Authorization = `Bearer ${jwt.sign({ id: user._id }, process.env.JWT_SECRET)}`;
  if (key) headers["Idempotency-Key"] = key;
  const response = await fetch(`${baseURL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json() };
}

test("snapshots contain original names, unit prices, quantities and rounded line totals", async () => {
  const pasta = await food();
  const tea = await food({ name: "Tea", price: 0.1 });
  const { order } = await place({ ...payload(pasta, pasta, tea), totalPrice: 1, items: [{ unitPrice: 0 }] });
  assert.equal(order.totalPrice, 24.8);
  const item = order.items.find((item) => String(item.foodId) === String(pasta._id));
  assert.equal(item.quantity, 2);
  assert.equal(item.unitPrice, 12.35);
  assert.equal(item.lineTotal, 24.7);
  await Food.findByIdAndUpdate(pasta._id, { name: "New pasta", price: 99 });
  await Food.findByIdAndDelete(tea._id);
  const stored = await Order.findById(order._id).populate("foods");
  assert.equal(stored.items.find((item) => String(item.foodId) === String(pasta._id)).name, "Pasta");
  assert.equal(stored.items.find((item) => String(item.foodId) === String(tea._id)).name, "Tea");
  assert.equal(stored.totalPrice, 24.8);
  stored.items[0].name = "Overwritten";
  stored.items[0].unitPrice = 0;
  await stored.save();
  const unchanged = await Order.findById(order._id);
  assert.notEqual(unchanged.items[0].name, "Overwritten");
  assert.notEqual(unchanged.items[0].unitPrice, 0);
});

test("concurrent checkouts never oversell the final portions", async () => {
  const pasta = await food({ stockQuantity: 3 });
  const attempts = await Promise.allSettled(Array.from({ length: 8 }, () => place(payload(pasta))));
  assert.equal(attempts.filter((attempt) => attempt.status === "fulfilled").length, 3);
  assert.equal(await Order.countDocuments(), 3);
  assert.equal(await InventoryHistory.countDocuments(), 3);
  const remaining = await Food.findById(pasta._id);
  assert.equal(remaining.stockQuantity, 0);
  assert.equal(remaining.isAvailable, false);
});

test("simultaneous retries create one order and decrement stock once", async () => {
  const pasta = await food();
  const key = randomUUID();
  const results = await Promise.all(Array.from({ length: 5 }, () => place(payload(pasta, pasta), key)));
  assert.equal(new Set(results.map(({ order }) => String(order._id))).size, 1);
  assert.equal(results.filter((result) => !result.replayed).length, 1);
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 8);
  assert.equal(await InventoryHistory.countDocuments(), 1);
});

test("keys are scoped to users and reject changed checkout details", async () => {
  const pasta = await food();
  const key = randomUUID();
  await place(payload(pasta), key);
  await assert.rejects(place({ ...payload(pasta), address: "Changed" }, key), { status: 409 });
  await place(payload(pasta), key, stranger);
  assert.equal(await Order.countDocuments(), 2);
});

test("a later unavailable item rolls back earlier stock changes", async () => {
  const first = await food({ _id: new mongoose.Types.ObjectId("000000000000000000000001") });
  const last = await food({ _id: new mongoose.Types.ObjectId("ffffffffffffffffffffffff"), stockQuantity: 0, isAvailable: false });
  await assert.rejects(place(payload(first, last)), { status: 409 });
  assert.equal((await Food.findById(first._id)).stockQuantity, 10);
  assert.equal(await Order.countDocuments(), 0);
  assert.equal(await InventoryHistory.countDocuments(), 0);
});

test("inventory-history failure rolls back both the order and stock", async () => {
  const pasta = await food();
  const original = InventoryHistory.create;
  InventoryHistory.create = async () => { throw new Error("Injected history failure"); };
  try { await assert.rejects(place(payload(pasta)), /Injected history failure/); }
  finally { InventoryHistory.create = original; }
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 10);
  assert.equal(await Order.countDocuments(), 0);
});

test("concurrent cancellations restore stock and record history exactly once", async () => {
  const pasta = await food({ stockQuantity: 2 });
  const { order } = await place(payload(pasta, pasta));
  const results = await Promise.all(Array.from({ length: 5 }, () => changeOrderStatus(customer, order._id, "cancelled")));
  assert.equal(results.filter((result) => result.changed).length, 1);
  const restored = await Food.findById(pasta._id);
  assert.equal(restored.stockQuantity, 2);
  assert.equal(restored.isAvailable, true);
  assert.equal(await InventoryHistory.countDocuments({ changeType: "order_cancelled" }), 1);
  assert.ok((await Order.findById(order._id)).stockRestoredAt);
});

test("a cancellation racing preparation has one valid winner", async () => {
  const pasta = await food();
  const { order } = await place(payload(pasta));
  const results = await Promise.allSettled([
    changeOrderStatus(customer, order._id, "cancelled"),
    changeOrderStatus(owner, order._id, "preparing"),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const stored = await Order.findById(order._id);
  assert.equal((await Food.findById(pasta._id)).stockQuantity, stored.status === "cancelled" ? 10 : 9);
});

test("status changes are sequential; preparation and terminal states cannot cancel", async () => {
  const pasta = await food();
  const { order } = await place(payload(pasta));
  await assert.rejects(changeOrderStatus(owner, order._id, "completed"), { status: 409 });
  await assert.rejects(changeOrderStatus(customer, order._id, "preparing"), { status: 409 });
  await changeOrderStatus(owner, order._id, "preparing");
  await assert.rejects(changeOrderStatus(owner, order._id, "cancelled"), { status: 409 });
  await changeOrderStatus(owner, order._id, "ready");
  await assert.rejects(changeOrderStatus(customer, order._id, "cancelled"), { status: 409 });
  await changeOrderStatus(owner, order._id, "completed");
  await assert.rejects(changeOrderStatus(owner, order._id, "preparing"), { status: 409 });
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 9);
});

test("legacy orders restore repeated food IDs exactly once", async () => {
  const pasta = await food({ stockQuantity: 8 });
  const order = await Order.create({ userId: customer._id, customerName: customer.username, foods: [pasta._id, pasta._id], totalPrice: 24.7 });
  await changeOrderStatus(customer, order._id, "cancelled");
  await changeOrderStatus(owner, order._id, "cancelled");
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 10);
});

test("cancellation failure rolls back restoration and status together", async () => {
  const pasta = await food();
  const { order } = await place(payload(pasta));
  const original = InventoryHistory.create;
  InventoryHistory.create = async () => { throw new Error("Injected cancellation failure"); };
  try { await assert.rejects(changeOrderStatus(customer, order._id, "cancelled"), /Injected cancellation failure/); }
  finally { InventoryHistory.create = original; }
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 9);
  assert.equal((await Order.findById(order._id)).status, "pending");
});

test("deleted menu items retain snapshots and do not prevent cancellation", async () => {
  const pasta = await food();
  const { order } = await place(payload(pasta));
  await Food.findByIdAndDelete(pasta._id);
  await changeOrderStatus(customer, order._id, "cancelled");
  const stored = await Order.findById(order._id);
  assert.equal(stored.status, "cancelled");
  assert.equal(stored.items[0].name, "Pasta");
  assert.equal(await Food.countDocuments(), 0);
});

test("HTTP checkout requires auth and key; retries return the same sanitized order", async () => {
  const pasta = await food();
  const body = payload(pasta);
  assert.equal((await request("", { user: null, method: "POST", body })).status, 401);
  assert.equal((await request("", { method: "POST", body })).status, 400);
  assert.equal((await request("", { method: "POST", key: randomUUID() })).status, 400);
  const key = randomUUID();
  const created = await request("", { method: "POST", body, key });
  assert.equal(created.status, 201);
  assert.deepEqual(created.data.allowedStatuses, ["cancelled"]);
  assert.equal(created.data.requestHash, undefined);
  const replay = await request("", { method: "POST", body, key });
  assert.equal(replay.status, 200);
  assert.equal(replay.data._id, created.data._id);
  assert.equal(replay.data.requestHash, undefined);
  const ownerOrders = await request("", { user: owner });
  assert.deepEqual(ownerOrders.data[0].allowedStatuses, ["preparing", "cancelled"]);
});

test("HTTP cancellation enforces ownership and owner-only status updates", async () => {
  const pasta = await food();
  const { order } = await place(payload(pasta));
  assert.equal((await request(`/${order._id}/cancel`, { user: stranger, method: "PATCH" })).status, 404);
  assert.equal((await request(`/${order._id}/status`, { method: "PATCH", body: { status: "preparing" } })).status, 403);
  assert.equal((await request(`/${order._id}/cancel`, { method: "PATCH" })).status, 200);
  assert.equal((await request(`/${order._id}/cancel`, { method: "PATCH" })).status, 200);
  assert.equal((await Food.findById(pasta._id)).stockQuantity, 10);
});

test("deletion rejects active orders and archives terminal orders without losing retry protection", async () => {
  const pasta = await food();
  const key = randomUUID();
  const body = payload(pasta);
  const { order } = await place(body, key);
  assert.equal((await request(`/${order._id}`, { user: owner, method: "DELETE" })).status, 409);
  await changeOrderStatus(owner, order._id, "cancelled");
  assert.equal((await request(`/${order._id}`, { user: owner, method: "DELETE" })).status, 200);
  assert.equal((await request("", { user: owner })).data.length, 0);
  assert.equal((await request("/me")).data.length, 1);
  const replay = await place(body, key);
  assert.equal(replay.replayed, true);
  assert.equal(replay.order.status, "cancelled");
  assert.equal(await Order.countDocuments(), 1);
});

test("malformed checkout and invalid transitions return client errors", async () => {
  await assert.rejects(place({ foods: ["bad-id"] }), { status: 400 });
  await assert.rejects(place({ foods: [] }), { status: 400 });
  await assert.rejects(place({ foods: [String(new mongoose.Types.ObjectId())], phone: {} }), { status: 400 });
  await assert.rejects(changeOrderStatus(owner, "bad-id", "cancelled"), { status: 400 });
  await assert.rejects(changeOrderStatus(owner, new mongoose.Types.ObjectId(), "unknown"), { status: 400 });
});
