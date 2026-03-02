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

const router = express.Router();

router.get("/", getAllFoods);
router.get("/category/:category", getFoodsByCategory);
router.get("/bestsellers", getBestSellers);
router.get("/combos", getCombos);

router.post("/", createFood);
router.put("/:id", updateFood);
router.delete("/:id", deleteFood);

export default router;
