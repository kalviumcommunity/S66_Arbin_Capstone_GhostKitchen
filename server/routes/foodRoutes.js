import express from 'express';
import {
  getAllFoods,
  getFoodsByCategory,
  getBestSellers,
  getCombos,
  addFoodItem // 👈 Added new controller
} from '../controllers/foodController.js';

const router = express.Router();

// ===================== OLD GET Routes =====================
router.get('/', getAllFoods);
router.get('/category/:cat', getFoodsByCategory);
router.get('/bestsellers', getBestSellers);
router.get('/combos', getCombos);

// ===================== NEW POST Route =====================
router.post('/', addFoodItem); // 👈 New POST endpoint

export default router;
