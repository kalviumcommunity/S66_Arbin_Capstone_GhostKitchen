import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true, immutable: true },
  name: { type: String, required: true, immutable: true },
  unitPrice: { type: Number, required: true, min: 0, immutable: true },
  quantity: { type: Number, required: true, min: 1, validate: Number.isInteger, immutable: true },
  lineTotal: { type: Number, required: true, min: 0, immutable: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  paymentMethod: { type: String, enum: ["cod", "razorpay"], default: "cod", immutable: true },
  paymentStatus: { type: String, enum: ["unpaid", "pending", "paid", "refund_pending", "refunded", "refund_failed"], default: "unpaid" },
  paymentExpiresAt: { type: Date },
  cancellationReason: { type: String },
  payment: {
    amountPaise: { type: Number, min: 0 },
    currency: { type: String, default: "INR" },
    gatewayOrderId: { type: String },
    paymentId: { type: String },
    paidAt: { type: Date },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    refundId: { type: String },
    refundStatus: { type: String, enum: ["requested", "pending", "processed", "failed"] },
    refundAmountPaise: { type: Number },
    refundReceipt: { type: String },
    refundAttempt: { type: Number, default: 0 },
    refundError: { type: String },
    checkoutLock: { type: String },
    checkoutLockUntil: { type: Date },
    refundLock: { type: String },
    refundLockUntil: { type: Date },
    reconciledAt: { type: Date },
  },
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
orderSchema.index({ "payment.gatewayOrderId": 1 }, { unique: true, sparse: true });
orderSchema.index({ "payment.paymentId": 1 }, { unique: true, sparse: true });
orderSchema.index({ paymentMethod: 1, paymentStatus: 1, status: 1, paymentExpiresAt: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
