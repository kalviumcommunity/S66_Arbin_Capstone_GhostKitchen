import mongoose from "mongoose";

export const INGREDIENT_UNITS = ["kg", "g", "l", "ml", "unit"];
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  unit: { type: String, enum: INGREDIENT_UNITS, required: true, immutable: true },
  stockQuantity: { type: Number, min: 0, default: 0 },
  lowStockThreshold: { type: Number, min: 0, required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  active: { type: Boolean, default: true },
  lastPurchasedAt: { type: Date },
}, { timestamps: true });
schema.index({ active: 1, name: 1 });
export default mongoose.model("Ingredient", schema);
