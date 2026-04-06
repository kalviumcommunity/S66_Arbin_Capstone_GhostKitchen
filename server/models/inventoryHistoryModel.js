import mongoose from "mongoose";

const inventoryHistorySchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    changeType: {
      type: String,
      enum: ["manual_adjustment", "order_placed"],
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  { timestamps: true }
);

inventoryHistorySchema.index({ foodId: 1, createdAt: -1 });

const InventoryHistory = mongoose.model("InventoryHistory", inventoryHistorySchema);

export default InventoryHistory;
