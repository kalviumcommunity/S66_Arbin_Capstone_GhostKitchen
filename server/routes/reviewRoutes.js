import express from "express";
import {
  createReview,
  deleteReview,
  getMyReviews,
  getReviewsByFood,
  getReviewStatsByFood,
  respondToReview,
  toggleHelpful,
  updateReview,
} from "../controllers/reviewController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/food/:foodId", getReviewsByFood);
router.get("/food/:foodId/stats", getReviewStatsByFood);

router.get("/me", protect, authorizeRoles("customer", "owner"), getMyReviews);
router.post("/", protect, authorizeRoles("customer", "owner"), createReview);
router.put("/:id", protect, authorizeRoles("customer", "owner"), updateReview);
router.delete("/:id", protect, authorizeRoles("customer", "owner"), deleteReview);
router.patch("/:id/helpful", protect, authorizeRoles("customer", "owner"), toggleHelpful);
router.patch("/:id/respond", protect, authorizeRoles("owner"), respondToReview);

export default router;
