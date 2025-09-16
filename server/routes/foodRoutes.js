// routes/foodRoutes.js
import express from "express";
import {
  getAllFoods,
  getFoodsByCategory,
  getBestSellers,
  getCombos,
  addFoodItem,
  updateFoodItem, // ✅ NEW IMPORT
} from "../controllers/foodController.js";

const router = express.Router();

// GET endpoints
router.get("/", getAllFoods);
router.get("/category/:category", getFoodsByCategory);
router.get("/bestsellers", getBestSellers);
router.get("/combos", getCombos);

// POST endpoint
router.post("/", addFoodItem);

// ✅ NEW: PUT endpoint
router.put("/:id", updateFoodItem);

export default router;
