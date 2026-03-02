import express from "express";
<<<<<<< HEAD
import { getAllOrders, createOrder, deleteOrder, deleteOrderItem } from "../controllers/orderController.js";
=======
import {
  getAllOrders,
  createOrder,
  deleteOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
>>>>>>> 0f7b9fb (bug fixes)

const router = express.Router();

router.get("/", getAllOrders);
router.post("/", createOrder);
router.delete("/:id", deleteOrder); // ✅ delete full order
router.delete("/:orderId/food/:foodId", deleteOrderItem); // ✅ delete one food from order

// ================== PATCH Order Status ==================
router.patch("/:id/status", updateOrderStatus);

// ================== DELETE Order ==================
router.delete("/:id", deleteOrder);

export default router;
