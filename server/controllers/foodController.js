import Food from "../models/foodModel.js";

const VALID_CATEGORIES = ["veg", "non-veg", "dessert", "combo", "sweet", "main", "bread"];
const VALID_TYPES = ["combo", "main", "sweet"];

export const getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch foods", error: error.message });
  }
};

export const getFoodsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const normalizedCategory = String(category).toLowerCase();

    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({ message: "Invalid category provided" });
    }

    const foods = await Food.find({ category: normalizedCategory });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category foods", error: error.message });
  }
};

export const getBestSellers = async (req, res) => {
  try {
    const foods = await Food.find({ isBestSeller: true });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bestsellers", error: error.message });
  }
};

export const getCombos = async (req, res) => {
  try {
    const foods = await Food.find({ category: "combo" });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch combos", error: error.message });
  }
};

export const createFood = async (req, res) => {
  try {
    const { name, category, price, isBestSeller, type, stockQuantity, lowStockThreshold, unit, isAvailable } = req.body;
    const normalizedCategory = typeof category === "string" ? category.toLowerCase() : category;
    const normalizedType = typeof type === "string" ? type.toLowerCase() : type;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required and must be a string" });
    }
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }
    if (!normalizedType || !VALID_TYPES.includes(normalizedType)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const normalizedStockQuantity = stockQuantity === undefined ? 0 : Number(stockQuantity);
    if (!Number.isFinite(normalizedStockQuantity) || normalizedStockQuantity < 0) {
      return res.status(400).json({ message: "stockQuantity must be a non-negative number" });
    }

    const normalizedLowStockThreshold = lowStockThreshold === undefined ? 5 : Number(lowStockThreshold);
    if (!Number.isFinite(normalizedLowStockThreshold) || normalizedLowStockThreshold < 0) {
      return res.status(400).json({ message: "lowStockThreshold must be a non-negative number" });
    }

    const normalizedUnit = typeof unit === "string" && unit.trim() ? unit.trim() : "portion";
    const normalizedIsAvailable = isAvailable === undefined ? normalizedStockQuantity > 0 : Boolean(isAvailable);

    const food = new Food({
      name,
      category: normalizedCategory,
      price,
      isBestSeller,
      type: normalizedType,
      stockQuantity: Math.floor(normalizedStockQuantity),
      lowStockThreshold: Math.floor(normalizedLowStockThreshold),
      unit: normalizedUnit,
      isAvailable: normalizedIsAvailable,
    });

    const savedFood = await food.save();
    res.status(201).json(savedFood);
  } catch (error) {
    res.status(500).json({ message: "Failed to add food", error: error.message });
  }
};

export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, isBestSeller, type, stockQuantity, lowStockThreshold, unit, isAvailable } = req.body;

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name must be a valid string" });
      }
      updateData.name = name;
    }

    if (category !== undefined) {
      const normalizedCategory = String(category).toLowerCase();
      if (!VALID_CATEGORIES.includes(normalizedCategory)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      updateData.category = normalizedCategory;
    }

    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) {
        return res.status(400).json({ message: "Invalid price" });
      }
      updateData.price = price;
    }

    if (type !== undefined) {
      const normalizedType = String(type).toLowerCase();
      if (!VALID_TYPES.includes(normalizedType)) {
        return res.status(400).json({ message: "Invalid type" });
      }
      updateData.type = normalizedType;
    }

    if (isBestSeller !== undefined) {
      updateData.isBestSeller = Boolean(isBestSeller);
    }

    if (stockQuantity !== undefined) {
      const normalizedStockQuantity = Number(stockQuantity);
      if (!Number.isFinite(normalizedStockQuantity) || normalizedStockQuantity < 0) {
        return res.status(400).json({ message: "stockQuantity must be a non-negative number" });
      }
      updateData.stockQuantity = Math.floor(normalizedStockQuantity);
    }

    if (lowStockThreshold !== undefined) {
      const normalizedLowStockThreshold = Number(lowStockThreshold);
      if (!Number.isFinite(normalizedLowStockThreshold) || normalizedLowStockThreshold < 0) {
        return res.status(400).json({ message: "lowStockThreshold must be a non-negative number" });
      }
      updateData.lowStockThreshold = Math.floor(normalizedLowStockThreshold);
    }

    if (unit !== undefined) {
      if (typeof unit !== "string" || !unit.trim()) {
        return res.status(400).json({ message: "unit must be a non-empty string" });
      }
      updateData.unit = unit.trim();
    }

    if (isAvailable !== undefined) {
      updateData.isAvailable = Boolean(isAvailable);
    }

    if (updateData.stockQuantity !== undefined && updateData.isAvailable === undefined) {
      updateData.isAvailable = updateData.stockQuantity > 0;
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
    res.status(500).json({ message: "Failed to update food", error: error.message });
  }
};

export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFood = await Food.findByIdAndDelete(id);

    if (!deletedFood) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete food", error: error.message });
  }
};
