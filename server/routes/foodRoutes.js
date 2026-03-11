import express from "express";
import {
  getAllFoods,
  getFoodsByCategory,
  getBestSellers,
  getCombos,
  createFood,
  updateFood,
  deleteFood,
} from "../controllers/foodController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getAllFoods);
router.get("/category/:category", getFoodsByCategory);
router.get("/bestsellers", getBestSellers);
router.get("/combos", getCombos);

router.post("/", protect, authorizeRoles("owner"), createFood);
router.put("/:id", protect, authorizeRoles("owner"), updateFood);
router.delete("/:id", protect, authorizeRoles("owner"), deleteFood);

export default router;
