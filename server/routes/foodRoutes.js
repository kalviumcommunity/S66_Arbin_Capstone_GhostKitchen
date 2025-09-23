// backend/routes/foodRoutes.js
import express from "express";
import { getAllFoods, getFoodsByCategory, addFood, updateFood, deleteFood } from "../controllers/foodController.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ import middleware

const router = express.Router();

router.get("/", getAllFoods);
router.get("/:category", getFoodsByCategory);

// Protected routes
router.post("/", protect, addFood);
router.put("/:id", protect, updateFood);
router.delete("/:id", protect, deleteFood); // ✅ secured

export default router;
