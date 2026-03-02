// backend/controllers/foodController.js
import Food from "../models/foodModel.js";

<<<<<<< HEAD
=======
// Utility: Allowed values
const VALID_CATEGORIES = ["veg", "non-veg", "dessert", "combo", "sweet", "main", "bread"];
const VALID_TYPES = ["combo", "main", "sweet"];

>>>>>>> 0f7b9fb (bug fixes)
// ✅ GET all foods
export const getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch foods", error: error.message });
  }
};

// ✅ GET foods by category
export const getFoodsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const foods = await Food.find({ category });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category foods", error: error.message });
  }
};

// ✅ POST add food
export const addFood = async (req, res) => {
  try {
    const { name, category, subcategory, price, isBestSeller } = req.body;

<<<<<<< HEAD
    if (!name || !category || !price) {
      return res.status(400).json({ message: "Name, category and price are required" });
    }

    const newFood = new Food({ name, category, subcategory, price, isBestSeller });
    const savedFood = await newFood.save();
=======
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
    const normalizedCategory = typeof category === "string" ? category.toLowerCase() : category;
    const normalizedType = typeof type === "string" ? type.toLowerCase() : type;

    // Input validation
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required and must be a string" });
    }
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }
    if (normalizedType && !VALID_TYPES.includes(normalizedType)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const food = new Food({
      name,
      category: normalizedCategory,
      price,
      isBestSeller,
      type: normalizedType,
    });
    const savedFood = await food.save();
>>>>>>> 0f7b9fb (bug fixes)
    res.status(201).json(savedFood);
  } catch (error) {
    res.status(500).json({ message: "Failed to add food", error: error.message });
  }
};

// ✅ PUT update food
export const updateFood = async (req, res) => {
  try {
<<<<<<< HEAD
    const updatedFood = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
=======
    const { id } = req.params;
    const { name, category, price, isBestSeller, type } = req.body;

    // Input validation
    const updateData = {};
    if (name) {
      if (typeof name !== "string") return res.status(400).json({ message: "Name must be a string" });
      updateData.name = name;
    }
    if (category) {
      const normalizedCategory = String(category).toLowerCase();
      if (!VALID_CATEGORIES.includes(normalizedCategory)) return res.status(400).json({ message: "Invalid category" });
      updateData.category = normalizedCategory;
    }
    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) return res.status(400).json({ message: "Invalid price" });
      updateData.price = price;
    }
    if (type) {
      const normalizedType = String(type).toLowerCase();
      if (!VALID_TYPES.includes(normalizedType)) return res.status(400).json({ message: "Invalid type" });
      updateData.type = normalizedType;
    }
    if (isBestSeller !== undefined) {
      updateData.isBestSeller = Boolean(isBestSeller);
    }

    const updatedFood = await Food.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

>>>>>>> 0f7b9fb (bug fixes)
    if (!updatedFood) {
      return res.status(404).json({ message: "Food not found" });
    }
    res.json(updatedFood);
  } catch (error) {
    res.status(500).json({ message: "Failed to update food", error: error.message });
  }
};

<<<<<<< HEAD
// ✅ DELETE food
export const deleteFood = async (req, res) => {
  try {
    const deletedFood = await Food.findByIdAndDelete(req.params.id);
    if (!deletedFood) {
      return res.status(404).json({ message: "Food not found" });
    }
    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete food", error: error.message });
=======
// DELETE food
export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFood = await Food.findByIdAndDelete(id);
    if (!deletedFood) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete food", error: error.message });
>>>>>>> 0f7b9fb (bug fixes)
  }
};
