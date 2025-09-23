// backend/routes/foodRoutes.js
import express from 'express';
import {
  getAllFoods,
  getFoodsByCategory,
  getBestSellers,
  getCombos,
  createFood,
  updateFood,
} from '../controllers/foodController.js';
import { deleteFood } from "../controllers/foodController.js";


const router = express.Router();

// ================== GET Routes ==================
router.get('/', getAllFoods);
router.get('/category/:category', getFoodsByCategory);
router.get('/bestsellers', getBestSellers);
router.get('/combos', getCombos);

// ================== POST Route ==================
router.post('/', createFood);

// ================== PUT Route ==================
router.put('/:id', updateFood);

router.delete("/:id", deleteFood);

export default router;
