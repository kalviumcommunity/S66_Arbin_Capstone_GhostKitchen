import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true, immutable: true },
  name: { type: String, required: true, immutable: true },
  unitPrice: { type: Number, required: true, min: 0, immutable: true },
  quantity: { type: Number, required: true, min: 1, validate: Number.isInteger, immutable: true },
  lineTotal: { type: Number, required: true, min: 0, immutable: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  items: { type: [orderItemSchema], default: undefined, immutable: true },
  idempotencyKey: { type: String, immutable: true },
  requestHash: { type: String, immutable: true, select: false },
  stockRestoredAt: { type: Date },
  archivedAt: { type: Date },
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
  reviewedItems: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Food",
    default: [],
  },
  isFullyReviewed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Legacy orders without a key remain valid; new keyed requests are unique per user.
orderSchema.index({ userId: 1, idempotencyKey: 1 }, {
  unique: true,
  partialFilterExpression: { idempotencyKey: { $type: "string" } },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
