import { createHash } from "node:crypto";
import mongoose from "mongoose";
import Supplier from "../models/supplierModel.js";
import Ingredient from "../models/ingredientModel.js";
import IngredientHistory from "../models/ingredientHistoryModel.js";
import PurchaseOrder from "../models/purchaseOrderModel.js";
import { OrderError } from "./orderPolicy.js";
import { number, objectId, requestKey, text, roundQuantity, toPaise } from "../utils/validation.js";

const hash = (body) => createHash("sha256").update(JSON.stringify(body)).digest("hex");
const assertReplay = (existing, digest) => {
  if (existing.requestHash !== digest) throw new OrderError(409, "This request key was already used with different details.");
};

export async function adjustIngredient(user, ingredientId, body, key) {
  objectId(ingredientId, "ingredient ID");
  requestKey(key);
  if (!["usage", "waste", "adjustment"].includes(body.type)) throw new OrderError(400, "Choose usage, waste, or adjustment.");
  number(body.quantity, "Quantity", { min: body.type === "adjustment" ? -1000000 : 0.001 });
  if (body.quantity === 0) throw new OrderError(400, "Quantity cannot be zero.");
  const note = text(body.note, "Note", { max: 1000 });
  const quantityChange = body.type === "adjustment" ? body.quantity : -body.quantity;
  const digest = hash({ type: body.type, quantityChange, note });
  await IngredientHistory.init();
  return mongoose.connection.transaction(async (session) => {
    const previous = await IngredientHistory.findOne({ ingredientId, requestKey: key }).session(session);
    if (previous) { assertReplay(previous, digest); return { replayed: true }; }
    const ingredient = await Ingredient.findOne({ _id: ingredientId, active: true }).session(session);
    if (!ingredient) throw new OrderError(404, "Ingredient not found.");
    const previousStock = ingredient.stockQuantity;
    const newStock = roundQuantity(previousStock + quantityChange);
    if (newStock < 0) throw new OrderError(409, "Ingredient stock cannot go below zero.");
    ingredient.stockQuantity = newStock;
    await ingredient.save({ session });
    await IngredientHistory.create([{
      ingredientId, ingredientName: ingredient.name, unit: ingredient.unit, type: body.type,
      quantityChange, previousStock, newStock, note, updatedBy: user._id, requestKey: key, requestHash: digest,
    }], { session });
    return { replayed: false };
  });
}

async function purchaseData(body, session) {
  objectId(body.supplierId, "supplier ID");
  const supplier = await Supplier.findOne({ _id: body.supplierId, active: true }).session(session);
  if (!supplier) throw new OrderError(400, "Choose an active supplier.");
  if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 50) throw new OrderError(400, "Provide 1–50 purchase lines.");
  const ids = body.lines.map((line) => objectId(line?.ingredientId, "ingredient ID"));
  if (new Set(ids).size !== ids.length) throw new OrderError(400, "Each ingredient can appear only once in a purchase order.");
  const ingredients = await Ingredient.find({ _id: { $in: ids }, active: true }).session(session);
  if (ingredients.length !== ids.length) throw new OrderError(400, "Choose active ingredients.");
  // Share a write with ingredient archiving so a concurrent archive cannot leave
  // a newly submitted purchase pointing at inactive inventory (write-skew).
  await Ingredient.updateMany({ _id: { $in: ids }, active: true }, { $set: { lastPurchasedAt: new Date() } }, { session });
  const map = new Map(ingredients.map((item) => [String(item._id), item]));
  const lines = body.lines.map((line) => {
    const ingredient = map.get(line.ingredientId.toLowerCase());
    const quantity = number(line.quantity, "Purchase quantity", { min: 0.001 });
    const unitPricePaise = toPaise(number(line.unitPrice, "Unit price", { decimals: 2 }));
    return { ingredientId: ingredient._id, name: ingredient.name, unit: ingredient.unit, quantity, unitPricePaise, lineTotalPaise: Math.round(unitPricePaise * quantity) };
  });
  const expectedDelivery = body.expectedDelivery ? new Date(body.expectedDelivery) : undefined;
  if (expectedDelivery && !Number.isFinite(expectedDelivery.getTime())) throw new OrderError(400, "Invalid expected delivery date.");
  return { supplierId: supplier._id, supplierName: supplier.name, lines, expectedDelivery,
    notes: text(body.notes, "Notes", { required: false, max: 1000 }), totalPaise: lines.reduce((sum, line) => sum + line.lineTotalPaise, 0) };
}

export async function savePurchaseOrder(user, body, id) {
  if (id) objectId(id, "purchase order ID");
  return mongoose.connection.transaction(async (session) => {
    const data = await purchaseData(body, session);
    if (!id) return (await PurchaseOrder.create([{ ...data, createdBy: user._id }], { session }))[0];
    const order = await PurchaseOrder.findById(id).session(session);
    if (!order) throw new OrderError(404, "Purchase order not found.");
    if (order.status !== "pending" || order.receipts.length) throw new OrderError(409, "Only an unsubmitted purchase order can be edited.");
    Object.assign(order, data);
    await order.save({ session });
    return order;
  });
}

export async function setPurchaseStatus(id, status) {
  objectId(id, "purchase order ID");
  const allowedFrom = status === "ordered" ? ["pending"] : status === "cancelled" ? ["pending", "ordered", "partially_received"] : [];
  if (!allowedFrom.length) throw new OrderError(400, "Choose ordered or cancelled.");
  const order = await PurchaseOrder.findOneAndUpdate({ _id: id, status: { $in: allowedFrom } }, { status }, { new: true });
  if (!order) throw new OrderError(409, "This purchase order cannot make that status change.");
  return order;
}

export async function receivePurchaseOrder(user, id, body, key) {
  objectId(id, "purchase order ID");
  requestKey(key);
  if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 50) throw new OrderError(400, "Provide receipt quantities.");
  const lines = body.lines.map((line) => ({ lineId: objectId(line?.lineId, "line ID"), quantity: number(line.quantity, "Received quantity", { min: 0.001 }) }))
    .sort((a, b) => a.lineId.localeCompare(b.lineId));
  if (new Set(lines.map((line) => line.lineId)).size !== lines.length) throw new OrderError(400, "Duplicate receipt line.");
  const digest = hash(lines);
  return mongoose.connection.transaction(async (session) => {
    const order = await PurchaseOrder.findById(id).session(session);
    if (!order) throw new OrderError(404, "Purchase order not found.");
    const previous = order.receipts.find((receipt) => receipt.key === key);
    if (previous) { assertReplay(previous, digest); return { order, replayed: true }; }
    if (!["ordered", "partially_received"].includes(order.status)) throw new OrderError(409, "Only submitted, open purchase orders can be received.");
    for (const received of lines) {
      const line = order.lines.id(received.lineId);
      if (!line || roundQuantity(line.receivedQuantity + received.quantity) > line.quantity) throw new OrderError(409, "Received quantity exceeds the outstanding purchase quantity.");
      const ingredient = await Ingredient.findOne({ _id: line.ingredientId, active: true }).session(session);
      if (!ingredient) throw new OrderError(409, "A purchase ingredient is no longer active.");
      const previousStock = ingredient.stockQuantity;
      ingredient.stockQuantity = roundQuantity(previousStock + received.quantity);
      await ingredient.save({ session });
      await IngredientHistory.create([{
        ingredientId: ingredient._id, ingredientName: line.name, unit: line.unit, type: "purchase_received",
        quantityChange: received.quantity, previousStock, newStock: ingredient.stockQuantity,
        purchaseOrderId: order._id, updatedBy: user._id,
      }], { session });
      line.receivedQuantity = roundQuantity(line.receivedQuantity + received.quantity);
    }
    order.status = order.lines.every((line) => line.receivedQuantity === line.quantity) ? "received" : "partially_received";
    order.receipts.push({ key, requestHash: digest, lines, receivedBy: user._id });
    await order.save({ session });
    return { order, replayed: false };
  });
}

export function purchaseCSV(orders) {
  const cell = (value) => {
    let str = String(value ?? "");
    if (/^[\s]*[=+\-@]/.test(str) || /^[\t\r\n]/.test(str)) str = `'${str}`;
    return `"${str.replaceAll('"', '""')}"`;
  };
  const rows = [["Purchase order", "Created", "Supplier", "Status", "Ingredient", "Unit", "Ordered", "Received", "Unit price (INR)", "Line total (INR)", "Expected delivery"]];
  for (const order of orders) for (const line of order.lines) rows.push([
    order._id, order.createdAt.toISOString(), order.supplierName, order.status, line.name, line.unit,
    line.quantity, line.receivedQuantity, (line.unitPricePaise / 100).toFixed(2), (line.lineTotalPaise / 100).toFixed(2), order.expectedDelivery?.toISOString() || "",
  ]);
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
