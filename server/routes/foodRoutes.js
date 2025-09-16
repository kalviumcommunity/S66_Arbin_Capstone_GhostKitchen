import express from 'express';
import {
  getAllFoods,
  getFoodsByCategory,
  getBestSellers,
  getCombos,
  addFoodItem,       // ✅ Added for POST
  updateFoodItem,    // ✅ Added for PUT
} from '../controllers/foodController.js';

const router = express.Router();

// GET routes
router.get('/', getAllFoods);
router.get('/category/:cat', getFoodsByCategory);
router.get('/bestsellers', getBestSellers);
router.get('/combos', getCombos);

// POST route
router.post('/', addFoodItem);   // ✅ New

// PUT route
router.put('/:id', updateFoodItem);   // ✅ New

export default router;
