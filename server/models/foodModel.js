import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["veg", "non-veg", "dessert", "combo", "sweet", "main", "bread"],
  },
  subcategory: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["combo", "main", "sweet"],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  isBestSeller: {
    type: Boolean,
    default: false,
  },
  stockQuantity: {
    type: Number,
    min: 0,
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    min: 0,
    default: 5,
  },
  unit: {
    type: String,
    trim: true,
    default: "portion",
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const Food = mongoose.model("Food", foodSchema);

export default Food;
