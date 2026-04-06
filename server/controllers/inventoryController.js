import Food from "../models/foodModel.js";
import InventoryHistory from "../models/inventoryHistoryModel.js";
import { emitToOwners } from "../socket/socketServer.js";

export const getInventoryItems = async (req, res) => {
  try {
    const foods = await Food.find().sort({ name: 1 });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory", error: error.message });
  }
};

export const getLowStockItems = async (req, res) => {
  try {
    const foods = await Food.find({ $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] } }).sort({
      stockQuantity: 1,
      name: 1,
    });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch low stock items", error: error.message });
  }
};

export const getInventoryHistory = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const history = await InventoryHistory.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("foodId", "name unit")
      .populate("updatedBy", "username email role")
      .populate("orderId", "status customerName");
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory history", error: error.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { stockQuantity, quantityChange, note } = req.body;

    if (stockQuantity === undefined && quantityChange === undefined) {
      return res.status(400).json({ message: "Provide stockQuantity or quantityChange" });
    }

    if (stockQuantity !== undefined && quantityChange !== undefined) {
      return res.status(400).json({ message: "Provide either stockQuantity or quantityChange, not both" });
    }

    const food = await Food.findById(foodId).select("name stockQuantity lowStockThreshold isAvailable");
    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    const previousStock = Number(food.stockQuantity) || 0;
    let nextStock = previousStock;

    if (stockQuantity !== undefined) {
      const parsed = Number(stockQuantity);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ message: "stockQuantity must be a non-negative number" });
      }
      nextStock = Math.floor(parsed);
    }

    if (quantityChange !== undefined) {
      const parsed = Number(quantityChange);
      if (!Number.isFinite(parsed)) {
        return res.status(400).json({ message: "quantityChange must be a number" });
      }
      nextStock = previousStock + Math.floor(parsed);
      if (nextStock < 0) {
        return res.status(400).json({ message: "Stock cannot go below zero" });
      }
    }

    const updatedFood = await Food.findByIdAndUpdate(
      foodId,
      {
        stockQuantity: nextStock,
        isAvailable: nextStock > 0,
      },
      { new: true }
    );

    const normalizedNote = typeof note === "string" ? note.trim() : "";

    await InventoryHistory.create({
      foodId: updatedFood._id,
      changeType: "manual_adjustment",
      previousStock,
      quantityChange: nextStock - previousStock,
      newStock: nextStock,
      note: normalizedNote || undefined,
      updatedBy: req.user?._id,
    });

    emitToOwners("inventory:changed", {
      source: "manual_adjustment",
      foodId: updatedFood._id,
      stockQuantity: updatedFood.stockQuantity,
      lowStockThreshold: updatedFood.lowStockThreshold,
      isAvailable: updatedFood.isAvailable,
    });

    res.json(updatedFood);
  } catch (error) {
    res.status(500).json({ message: "Failed to update stock", error: error.message });
  }
};
