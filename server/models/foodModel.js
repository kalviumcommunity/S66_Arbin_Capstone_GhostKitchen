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
    enum: ["veg", "non-veg", "dessert", "combo", "sweet", "main", "bread"], // ✅ restrict categories
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
  type: {
    type: String,
    required: true,
    enum: ["combo", "main", "sweet"],
  },
}, { timestamps: true });

const Food = mongoose.model("Food", foodSchema);

export default Food;
