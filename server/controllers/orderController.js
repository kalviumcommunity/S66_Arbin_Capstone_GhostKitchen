import Order from "../models/orderModel.js";
import Food from "../models/foodModel.js";

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
    const { customerName, foods } = req.body;

    if (!customerName || !foods || !Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ message: "Invalid input. Provide customerName and at least one food ID." });
    }

    const uniqueFoodIds = [...new Set(foods.map((foodId) => String(foodId)))];
    const foodDocs = await Food.find({ _id: { $in: uniqueFoodIds } });

    if (foodDocs.length !== uniqueFoodIds.length) {
      return res.status(400).json({ message: "One or more food IDs are invalid." });
    }

    const priceMap = new Map(foodDocs.map((food) => [String(food._id), food.price]));
    const totalPrice = foods.reduce((sum, foodId) => sum + (priceMap.get(String(foodId)) || 0), 0);

    const order = new Order({ customerName, foods, totalPrice });
    const savedOrder = await order.save();

    res.status(201).json(await savedOrder.populate("foods"));
  } catch (error) {
    res.status(400).json({ message: "Failed to create order", error: error.message });
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

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: "Failed to update order status", error: error.message });
  }
};
