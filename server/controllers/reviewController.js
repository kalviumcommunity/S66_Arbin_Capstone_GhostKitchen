import Food from "../models/foodModel.js";
import Order from "../models/orderModel.js";
import Review from "../models/reviewModel.js";

const emptyDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

const refreshFoodRatings = async (foodId) => {
  const stats = await Review.aggregate([
    { $match: { foodId } },
    {
      $group: {
        _id: "$foodId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const distributionRows = await Review.aggregate([
    { $match: { foodId } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const distribution = { ...emptyDistribution };
  for (const row of distributionRows) {
    distribution[String(row._id)] = row.count;
  }

  await Food.findByIdAndUpdate(foodId, {
    averageRating: stats[0]?.averageRating ? Number(stats[0].averageRating.toFixed(1)) : 0,
    totalReviews: stats[0]?.totalReviews || 0,
    ratingDistribution: distribution,
  });
};

const sanitizeReview = (review, currentUserId) => {
  const raw = review.toObject ? review.toObject() : review;
  return {
    ...raw,
    isHelpfulByMe: currentUserId ? raw.helpfulBy?.some((id) => String(id) === String(currentUserId)) : false,
    helpfulBy: undefined,
  };
};

export const createReview = async (req, res) => {
  try {
    const { foodId, orderId, rating, comment, images } = req.body;
    const userId = req.user?._id;

    if (!foodId || !orderId || !rating) {
      return res.status(400).json({ message: "foodId, orderId and rating are required" });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({ message: "You can review only completed orders" });
    }

    const foodExistsInOrder = order.foods.some((id) => String(id) === String(foodId));
    if (!foodExistsInOrder) {
      return res.status(400).json({ message: "This food is not part of the selected order" });
    }

    const review = await Review.create({
      foodId,
      orderId,
      userId,
      rating: Math.round(numericRating),
      comment: typeof comment === "string" ? comment.trim() : "",
      images: Array.isArray(images) ? images.filter(Boolean) : [],
    });

    const reviewedSet = new Set(order.reviewedItems.map((id) => String(id)));
    reviewedSet.add(String(foodId));
    const reviewedItems = Array.from(reviewedSet);
    const uniqueFoodsInOrder = new Set(order.foods.map((id) => String(id)));
    const isFullyReviewed = reviewedItems.length >= uniqueFoodsInOrder.size;

    order.reviewedItems = reviewedItems;
    order.isFullyReviewed = isFullyReviewed;
    await order.save();

    await refreshFoodRatings(review.foodId);

    const populated = await Review.findById(review._id)
      .populate("userId", "username")
      .populate("foodId", "name")
      .populate("orderId", "createdAt status");

    res.status(201).json(sanitizeReview(populated, req.user?._id));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Review already exists for this food in the selected order" });
    }
    res.status(500).json({ message: "Failed to create review", error: error.message });
  }
};

export const getReviewsByFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const reviews = await Review.find({ foodId })
      .sort({ createdAt: -1 })
      .populate("userId", "username")
      .lean();

    const payload = reviews.map((review) => sanitizeReview(review, req.user?._id));
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("foodId", "name")
      .populate("orderId", "createdAt status")
      .lean();

    res.json(reviews.map((review) => sanitizeReview(review, req.user?._id)));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your reviews", error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;
    const review = await Review.findOne({ _id: id, userId: req.user._id });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: "rating must be between 1 and 5" });
      }
      review.rating = Math.round(numericRating);
    }

    if (comment !== undefined) {
      review.comment = typeof comment === "string" ? comment.trim() : "";
    }

    if (images !== undefined) {
      review.images = Array.isArray(images) ? images.filter(Boolean) : [];
    }

    await review.save();
    await refreshFoodRatings(review.foodId);

    const populated = await Review.findById(review._id)
      .populate("userId", "username")
      .populate("foodId", "name")
      .populate("orderId", "createdAt status");

    res.json(sanitizeReview(populated, req.user?._id));
  } catch (error) {
    res.status(500).json({ message: "Failed to update review", error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await Order.findByIdAndUpdate(review.orderId, {
      $pull: { reviewedItems: review.foodId },
      isFullyReviewed: false,
    });

    await refreshFoodRatings(review.foodId);

    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete review", error: error.message });
  }
};

export const toggleHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const userId = String(req.user._id);
    const helpfulBy = review.helpfulBy.map((entry) => String(entry));
    const hasMarked = helpfulBy.includes(userId);

    if (hasMarked) {
      review.helpfulBy = review.helpfulBy.filter((entry) => String(entry) !== userId);
      review.helpful = Math.max(0, (review.helpful || 0) - 1);
    } else {
      review.helpfulBy.push(req.user._id);
      review.helpful = (review.helpful || 0) + 1;
    }

    await review.save();

    res.json({
      helpful: review.helpful,
      isHelpfulByMe: !hasMarked,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update helpful count", error: error.message });
  }
};

export const respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Response message is required" });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      {
        ownerResponse: {
          message: String(message).trim(),
          respondedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate("userId", "username")
      .populate("foodId", "name")
      .populate("orderId", "createdAt status");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(sanitizeReview(review, req.user?._id));
  } catch (error) {
    res.status(500).json({ message: "Failed to respond to review", error: error.message });
  }
};

export const getReviewStatsByFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const food = await Food.findById(foodId).select("averageRating totalReviews ratingDistribution name");

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json({
      foodId: food._id,
      name: food.name,
      averageRating: food.averageRating,
      totalReviews: food.totalReviews,
      ratingDistribution: food.ratingDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch review stats", error: error.message });
  }
};
