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

// ✅ GET by category
export const getFoodsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const foods = await Food.find({ category });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category foods", error: error.message });
  }
};

// ✅ GET Bestsellers
export const getBestSellers = async (req, res) => {
  try {
    const foods = await Food.find({ isBestSeller: true });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bestsellers", error: error.message });
  }
};

// ✅ GET Combos
export const getCombos = async (req, res) => {
  try {
    // Assumes you store combos with type: "combo" in DB
    const combos = await Food.find({ type: "combo" });
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch combos", error: error.message });
  }
};

// ✅ POST - Add new food
export const createFood = async (req, res) => {
  try {
    const food = new Food(req.body);
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
    const updatedFood = await Food.findByIdAndUpdate(id, req.body, {
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
