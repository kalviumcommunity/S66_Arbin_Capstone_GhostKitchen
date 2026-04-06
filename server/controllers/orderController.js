import Order from "../models/orderModel.js";
import Food from "../models/foodModel.js";
import InventoryHistory from "../models/inventoryHistoryModel.js";
import { emitToOwners, emitToUser } from "../socket/socketServer.js";

const VALID_ORDER_STATUS = ["pending", "preparing", "ready", "completed", "cancelled"];

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("foods");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { customerName, foods, phone, address } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!foods || !Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ message: "Invalid input. Provide at least one food ID." });
    }

    const uniqueFoodIds = [...new Set(foods.map((foodId) => String(foodId)))];
    const foodDocs = await Food.find({ _id: { $in: uniqueFoodIds } });

    if (foodDocs.length !== uniqueFoodIds.length) {
      return res.status(400).json({ message: "One or more food IDs are invalid." });
    }

    const priceMap = new Map(foodDocs.map((food) => [String(food._id), food.price]));
    const countByFoodId = foods.reduce((acc, foodId) => {
      const key = String(foodId);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    for (const foodDoc of foodDocs) {
      const requiredQty = countByFoodId[String(foodDoc._id)] || 0;
      const availableQty = Number(foodDoc.stockQuantity) || 0;
      const canSell = foodDoc.isAvailable !== false;

      if (!canSell || availableQty < requiredQty) {
        return res.status(400).json({
          message: `Insufficient stock for ${foodDoc.name}`,
        });
      }
    }

    const totalPrice = foods.reduce((sum, foodId) => sum + (priceMap.get(String(foodId)) || 0), 0);

    const normalizedCustomerName =
      typeof customerName === "string" && customerName.trim() ? customerName.trim() : req.user.username;

    const order = new Order({
      customerName: normalizedCustomerName,
      foods,
      totalPrice,
      phone,
      address,
      userId,
    });
    const savedOrder = await order.save();

    for (const foodDoc of foodDocs) {
      const qty = countByFoodId[String(foodDoc._id)] || 0;
      if (!qty) continue;

      const previousStock = Number(foodDoc.stockQuantity) || 0;
      const newStock = Math.max(previousStock - qty, 0);

      foodDoc.stockQuantity = newStock;
      foodDoc.isAvailable = newStock > 0;
      await foodDoc.save();

      await InventoryHistory.create({
        foodId: foodDoc._id,
        changeType: "order_placed",
        previousStock,
        quantityChange: -qty,
        newStock,
        updatedBy: req.user?._id,
        orderId: savedOrder._id,
      });
    }

    const populatedOrder = await savedOrder.populate("foods");

    emitToOwners("owner:order:new", {
      order: populatedOrder,
      message: `New order placed by ${populatedOrder.customerName}`,
    });

    emitToUser(userId, "customer:order:new", {
      order: populatedOrder,
      message: "Your order has been placed",
    });

    emitToOwners("inventory:changed", {
      source: "order_placed",
      orderId: savedOrder._id,
      foodIds: foodDocs.map((foodDoc) => foodDoc._id),
    });

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(400).json({ message: "Failed to create order", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).populate("foods").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your orders", error: error.message });
  }
};

export const getMyOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id, userId: req.user._id }).populate("foods");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Failed to fetch order", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete order", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_ORDER_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate("foods");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    emitToOwners("owner:order:updated", {
      order: updatedOrder,
      message: `Order #${String(updatedOrder._id).slice(-6).toUpperCase()} moved to ${updatedOrder.status}`,
    });

    emitToUser(updatedOrder.userId, "customer:order:updated", {
      order: updatedOrder,
      message: `Your order status is now ${updatedOrder.status}`,
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: "Failed to update order status", error: error.message });
  }
};
