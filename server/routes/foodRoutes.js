// backend/routes/foodRoutes.js
import express from "express";
import {
  getAllFoods,
  getFoodsByCategory,
  addFood,
  updateFood,
  deleteFood,
} from "../controllers/foodController.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ import middleware

const router = express.Router();

// Public routes
router.get("/", getAllFoods);
router.get("/:category", getFoodsByCategory);

// Protected routes (only logged-in owner should access)
router.post("/", protect, addFood); // ✅ now protected
router.put("/:id", protect, updateFood); // ✅ now protected
router.delete("/:id", protect, deleteFood); // ✅ now protected

export default router;
