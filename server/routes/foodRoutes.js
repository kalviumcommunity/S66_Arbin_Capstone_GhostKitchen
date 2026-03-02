// backend/routes/foodRoutes.js
import express from "express";
import {
  getAllFoods,
  getFoodsByCategory,
  addFood,
  updateFood,
  deleteFood,
<<<<<<< HEAD
} from "../controllers/foodController.js";
import protect  from "../middleware/authMiddleware.js"; // ✅ middleware
=======
} from '../controllers/foodController.js';
>>>>>>> 0f7b9fb (bug fixes)

const router = express.Router();

// Public routes
router.get("/", getAllFoods);
router.get("/:category", getFoodsByCategory);

// Protected routes (must be logged in)
router.post("/", protect, addFood);
router.put("/:id", protect, updateFood);
router.delete("/:id", protect, deleteFood); // ✅ secured with middleware

// ================== DELETE Route ==================
router.delete('/:id', deleteFood);

export default router;
