// backend/controllers/foodController.js
import Food from "../models/foodModel.js";

// Utility: Allowed values
const VALID_CATEGORIES = ["veg", "non-veg", "dessert", "combo"];
const VALID_TYPES = ["main", "side", "drink", "dessert"];

// ✅ GET all foods
export const getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find();
    if (!foods.length) {
      return res.status(404).json({ message: "No foods found" });
    }
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch foods", error: error.message });
  }
};

// ✅ GET by category
export const getFoodsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Validation
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category provided" });
    }

    const foods = await Food.find({ category });
    if (!foods.length) {
      return res.status(404).json({ message: `No foods found in category: ${category}` });
    }

    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category foods", error: error.message });
  }
};

// ✅ GET Bestsellers
export const getBestSellers = async (req, res) => {
  try {
    const foods = await Food.find({ isBestSeller: true });
    if (!foods.length) {
      return res.status(404).json({ message: "No bestsellers found" });
    }
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bestsellers", error: error.message });
  }
};

// ✅ GET Combos
export const getCombos = async (req, res) => {
  try {
    const foods = await Food.find({ category: "combo" });
    if (!foods.length) {
      return res.status(404).json({ message: "No combos found" });
    }
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch combos", error: error.message });
  }
};

// ✅ POST - Add new food
export const createFood = async (req, res) => {
  try {
    const { name, category, price, isBestSeller, type } = req.body;

    // Input validation
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required and must be a string" });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({ message: "Price must be a positive number" });
    }
    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const food = new Food({ name, category, price, isBestSeller, type });
    const savedFood = await food.save();
    res.status(201).json(savedFood);
  } catch (error) {
    res.status(400).json({ message: "Failed to create food", error: error.message });
  }
};

// ✅ PUT - Update food
export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, isBestSeller, type } = req.body;

    // Input validation
    const updateData = {};
    if (name) {
      if (typeof name !== "string") return res.status(400).json({ message: "Name must be a string" });
      updateData.name = name;
    }
    if (category) {
      if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ message: "Invalid category" });
      updateData.category = category;
    }
    if (price !== undefined) {
      if (typeof price !== "number" || price <= 0) return res.status(400).json({ message: "Invalid price" });
      updateData.price = price;
    }
    if (type) {
      if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
      updateData.type = type;
    }
    if (isBestSeller !== undefined) {
      updateData.isBestSeller = Boolean(isBestSeller);
    }

    const updatedFood = await Food.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedFood) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json(updatedFood);
  } catch (error) {
    res.status(400).json({ message: "Failed to update food", error: error.message });
  }
};
