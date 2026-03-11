import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  foods: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["pending", "preparing", "ready", "completed", "cancelled"],
    default: "pending",
  },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

export default Order;
