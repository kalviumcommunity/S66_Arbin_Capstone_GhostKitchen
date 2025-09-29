import express from "express";
import { getAllOrders, createOrder, deleteOrder, deleteOrderItem } from "../controllers/orderController.js";

const router = express.Router();

router.get("/", getAllOrders);
router.post("/", createOrder);
router.delete("/:id", deleteOrder); // ✅ delete full order
router.delete("/:orderId/food/:foodId", deleteOrderItem); // ✅ delete one food from order

export default router;
