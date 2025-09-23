// models/foodModel.js
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
    enum: ["veg", "non-veg", "dessert", "combo", "sweet", "main", "bread"], // ✅ main categories
  },
  subcategory: {
    type: String,
    trim: true, // optional but nice to have
  },
  price: {
    type: Number,
    required: true,
    min: 0, // ✅ allows 0 but no negatives
  },
  isBestSeller: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Food = mongoose.model("Food", foodSchema);

export default Food;
