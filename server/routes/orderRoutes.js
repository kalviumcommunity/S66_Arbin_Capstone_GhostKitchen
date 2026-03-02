import express from "express";
import {
  getAllOrders,
  createOrder,
  deleteOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/", getAllOrders);
router.post("/", createOrder);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;
