import express from "express";
import { getDashboardStats } from "../controllers/analyticsController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, authorizeRoles("owner"), getDashboardStats);

export default router;
