import mongoose from "mongoose";

const lineSchema = new mongoose.Schema({
  ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, min: 0.001, required: true },
  unitPricePaise: { type: Number, min: 0, required: true },
  lineTotalPaise: { type: Number, min: 0, required: true },
  receivedQuantity: { type: Number, min: 0, default: 0 },
});
const receiptSchema = new mongoose.Schema({
  key: { type: String, required: true },
  requestHash: { type: String, required: true },
  lines: [{ lineId: mongoose.Schema.Types.ObjectId, quantity: Number }],
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receivedAt: { type: Date, default: Date.now },
}, { _id: false });
const schema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  supplierName: { type: String, required: true },
  lines: { type: [lineSchema], required: true },
  status: { type: String, enum: ["pending", "ordered", "partially_received", "received", "cancelled"], default: "pending" },
  expectedDelivery: { type: Date },
  notes: { type: String, maxlength: 1000 },
  totalPaise: { type: Number, min: 0, required: true },
  receipts: { type: [receiptSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
schema.index({ createdAt: -1 });
export default mongoose.model("PurchaseOrder", schema);
