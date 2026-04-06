import express from "express";
import {
  getInventoryHistory,
  getInventoryItems,
  getLowStockItems,
  updateStock,
} from "../controllers/inventoryController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("owner"));

router.get("/", getInventoryItems);
router.get("/low-stock", getLowStockItems);
router.get("/history", getInventoryHistory);
router.patch("/:foodId/stock", updateStock);

export default router;
