import mongoose from "mongoose";

const schema = new mongoose.Schema({
  ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
  ingredientName: { type: String, required: true },
  unit: { type: String, required: true },
  type: { type: String, enum: ["purchase_received", "usage", "waste", "adjustment"], required: true },
  quantityChange: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, min: 0, required: true },
  note: { type: String, maxlength: 1000 },
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestKey: { type: String },
  requestHash: { type: String },
}, { timestamps: true });
schema.index({ ingredientId: 1, createdAt: -1 });
schema.index({ ingredientId: 1, requestKey: 1 }, { unique: true, partialFilterExpression: { requestKey: { $type: "string" } } });
export default mongoose.model("IngredientHistory", schema);
