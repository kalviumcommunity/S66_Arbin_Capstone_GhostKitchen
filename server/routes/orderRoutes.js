import express from "express";
import {
  getAllOrders,
  getMyOrderById,
  getMyOrders,
  createOrder,
  deleteOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("owner"), getAllOrders);
router.get("/me", protect, authorizeRoles("customer", "owner"), getMyOrders);
router.get("/me/:id", protect, authorizeRoles("customer", "owner"), getMyOrderById);
router.post("/", protect, authorizeRoles("customer", "owner"), createOrder);
router.patch("/:id/status", protect, authorizeRoles("owner"), updateOrderStatus);
router.delete("/:id", protect, authorizeRoles("owner"), deleteOrder);

export default router;
