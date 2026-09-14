import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    helpful: {
      type: Number,
      min: 0,
      default: 0,
    },
    helpfulBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    ownerResponse: {
      message: { type: String, trim: true, maxlength: 1000 },
      respondedAt: { type: Date },
    },
  },
  { timestamps: true }
);

reviewSchema.index({ foodId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ foodId: 1, userId: 1, orderId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
