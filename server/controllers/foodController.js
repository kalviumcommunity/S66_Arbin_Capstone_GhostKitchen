// backend/controllers/foodController.js
import Food from "../models/foodModel.js";

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

    if (!name || !category || !price) {
      return res.status(400).json({ message: "Name, category and price are required" });
    }

    const newFood = new Food({ name, category, subcategory, price, isBestSeller });
    const savedFood = await newFood.save();
    res.status(201).json(savedFood);
  } catch (error) {
    res.status(500).json({ message: "Failed to add food", error: error.message });
  }
};

// ✅ PUT update food
export const updateFood = async (req, res) => {
  try {
    const updatedFood = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedFood) {
      return res.status(404).json({ message: "Food not found" });
    }
    res.json(updatedFood);
  } catch (error) {
    res.status(500).json({ message: "Failed to update food", error: error.message });
  }
};

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
  }
};
