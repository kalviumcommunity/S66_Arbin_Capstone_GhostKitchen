import express from "express";
import mongoose from "mongoose";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import Supplier from "../models/supplierModel.js";
import Ingredient, { INGREDIENT_UNITS } from "../models/ingredientModel.js";
import IngredientHistory from "../models/ingredientHistoryModel.js";
import PurchaseOrder from "../models/purchaseOrderModel.js";
import { OrderError } from "../services/orderPolicy.js";
import { adjustIngredient, purchaseCSV, receivePurchaseOrder, savePurchaseOrder, setPurchaseStatus } from "../services/procurementService.js";
import { number, objectId, route, text } from "../utils/validation.js";
import { emitToOwners } from "../socket/socketServer.js";

const router = express.Router();
router.use(protect, authorizeRoles("owner"));

function supplierData(body) {
  const data = { name: text(body.name, "Supplier name", { max: 120 }) };
  for (const [field, max] of [["contactName", 120], ["email", 254], ["phone", 40], ["address", 500], ["notes", 1000]]) {
    data[field] = text(body[field], field, { required: false, max });
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new OrderError(400, "Invalid supplier email.");
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") throw new OrderError(400, "active must be a boolean.");
    data.active = body.active;
  }
  return data;
}

router.get("/suppliers", route(async (req, res) => res.json(await Supplier.find().sort({ name: 1 }).limit(1000))));
router.post("/suppliers", route(async (req, res) => res.status(201).json(await Supplier.create(supplierData(req.body || {})))));
router.put("/suppliers/:id", route(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(objectId(req.params.id), supplierData(req.body || {}), { new: true, runValidators: true });
  if (!supplier) throw new OrderError(404, "Supplier not found.");
  res.json(supplier);
}));
router.delete("/suppliers/:id", route(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(objectId(req.params.id), { active: false }, { new: true });
  if (!supplier) throw new OrderError(404, "Supplier not found.");
  res.json(supplier);
}));

router.get("/ingredients", route(async (req, res) => {
  const items = await Ingredient.find({ active: true }).populate("supplierId", "name").sort({ name: 1 }).limit(1000);
  res.json(items.map((item) => ({ ...item.toObject(), lowStock: item.stockQuantity <= item.lowStockThreshold })));
}));
function historyFilter(query) {
  const filter = {};
  if (query.ingredientId) filter.ingredientId = new mongoose.Types.ObjectId(objectId(query.ingredientId));
  if (query.days) {
    const days = Number(query.days);
    number(days, "History days", { min: 1, max: 365, decimals: 0 });
    filter.createdAt = { $gte: new Date(Date.now() - days * 86400000) };
  }
  return filter;
}
router.get("/ingredients/summary", route(async (req, res) => {
  res.json(await IngredientHistory.aggregate([
    { $match: { ...historyFilter(req.query), type: { $in: ["usage", "waste"] } } },
    { $group: { _id: "$ingredientId", total: { $sum: { $multiply: ["$quantityChange", -1] } } } },
    { $project: { _id: 0, ingredientId: "$_id", total: { $round: ["$total", 3] } } },
  ]));
}));
router.get("/ingredients/history", route(async (req, res) => {
  const filter = historyFilter(req.query);
  res.json(await IngredientHistory.find(filter).select("-requestHash -requestKey").populate("updatedBy", "username").sort({ createdAt: -1 }).limit(500));
}));

async function ingredientData(body) {
  if (body.supplierId) {
    objectId(body.supplierId, "supplier ID");
    if (!await Supplier.exists({ _id: body.supplierId, active: true })) throw new OrderError(400, "Choose an active supplier.");
  }
  return {
    name: text(body.name, "Ingredient name", { max: 120 }),
    category: text(body.category, "Category", { max: 80 }),
    lowStockThreshold: number(body.lowStockThreshold, "Low-stock threshold"),
    supplierId: body.supplierId || null,
  };
}
router.post("/ingredients", route(async (req, res) => {
  const body = req.body || {};
  if (!INGREDIENT_UNITS.includes(body.unit)) throw new OrderError(400, "Choose kg, g, l, ml, or unit.");
  const data = await ingredientData(body);
  const initialStock = number(body.stockQuantity ?? 0, "Opening stock");
  const ingredient = await mongoose.connection.transaction(async (session) => {
    const [item] = await Ingredient.create([{ ...data, unit: body.unit, stockQuantity: initialStock }], { session });
    if (initialStock) await IngredientHistory.create([{
      ingredientId: item._id, ingredientName: item.name, unit: item.unit, type: "adjustment", previousStock: 0,
      quantityChange: initialStock, newStock: initialStock, note: "Opening stock", updatedBy: req.user._id,
    }], { session });
    return item;
  });
  emitToOwners("ingredients:changed", { ingredientId: ingredient._id });
  res.status(201).json(ingredient);
}));
router.put("/ingredients/:id", route(async (req, res) => {
  const body = req.body || {};
  const item = await Ingredient.findOne({ _id: objectId(req.params.id), active: true });
  if (!item) throw new OrderError(404, "Ingredient not found.");
  if ((body.unit !== undefined && body.unit !== item.unit) || body.stockQuantity !== undefined) throw new OrderError(400, "Units cannot change; use a stock adjustment to change quantity.");
  const data = await ingredientData(body);
  const updated = await Ingredient.findByIdAndUpdate(item._id, data, { new: true, runValidators: true });
  emitToOwners("ingredients:changed", { ingredientId: item._id });
  res.json(updated);
}));
router.delete("/ingredients/:id", route(async (req, res) => {
  const id = objectId(req.params.id);
  await mongoose.connection.transaction(async (session) => {
    const item = await Ingredient.findById(id).session(session);
    if (!item) throw new OrderError(404, "Ingredient not found.");
    const pending = await PurchaseOrder.exists({ "lines.ingredientId": id, status: { $in: ["pending", "ordered", "partially_received"] } }).session(session);
    if (item.stockQuantity || pending) throw new OrderError(409, "Use remaining stock and close open purchases before archiving this ingredient.");
    item.active = false;
    await item.save({ session });
  });
  emitToOwners("ingredients:changed", { ingredientId: id });
  res.json({ message: "Ingredient archived." });
}));
router.post("/ingredients/:id/adjustments", route(async (req, res) => {
  const result = await adjustIngredient(req.user, req.params.id, req.body || {}, req.get("Idempotency-Key"));
  if (!result.replayed) emitToOwners("ingredients:changed", { ingredientId: req.params.id });
  res.json({ ...result, ingredient: await Ingredient.findById(req.params.id) });
}));

router.get("/purchase-orders/export", route(async (req, res) => {
  const orders = await PurchaseOrder.find().sort({ createdAt: -1 }).limit(10000);
  res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="purchase-orders.csv"' }).send(purchaseCSV(orders));
}));
router.get("/purchase-orders", route(async (req, res) => res.json(await PurchaseOrder.find().sort({ createdAt: -1 }).limit(1000))));
router.post("/purchase-orders", route(async (req, res) => res.status(201).json(await savePurchaseOrder(req.user, req.body || {}))));
router.put("/purchase-orders/:id", route(async (req, res) => res.json(await savePurchaseOrder(req.user, req.body || {}, req.params.id))));
router.patch("/purchase-orders/:id/status", route(async (req, res) => res.json(await setPurchaseStatus(req.params.id, req.body?.status))));
router.post("/purchase-orders/:id/receive", route(async (req, res) => {
  const result = await receivePurchaseOrder(req.user, req.params.id, req.body || {}, req.get("Idempotency-Key"));
  if (!result.replayed) emitToOwners("ingredients:changed", { purchaseOrderId: req.params.id });
  res.json(result.order);
}));

export default router;
