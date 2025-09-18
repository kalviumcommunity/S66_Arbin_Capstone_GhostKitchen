// backend/routes/orderRoutes.js
import express from "express";
import { getAllOrders, createOrder } from "../controllers/orderController.js";

const router = express.Router();

// ================== GET Orders ==================
router.get("/", getAllOrders);

// ================== POST Order ==================
router.post("/", createOrder);

export default router;
