import express from 'express';
import {
  getAllFoods,
  getFoodsByCategory,
  getBestSellers,
  getCombos,
} from '../controllers/foodController.js';

const router = express.Router();

router.get('/', getAllFoods);
router.get('/category/:cat', getFoodsByCategory);
router.get('/bestsellers', getBestSellers);
router.get('/combos', getCombos);

export default router;
