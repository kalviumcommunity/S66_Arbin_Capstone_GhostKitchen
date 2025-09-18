import Order from "../models/orderModel.js";
import Food from "../models/foodModel.js";

// ✅ GET all orders with populated food details
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("foods");
    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// ✅ POST - Create new order
export const createOrder = async (req, res) => {
  try {
    const { customerName, foods } = req.body;

    // Validate required fields
    if (!customerName || !foods || !Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ message: "Invalid input. Provide customerName and at least one food ID." });
    }

    // Validate food IDs exist
    const foodDocs = await Food.find({ _id: { $in: foods } });
    if (foodDocs.length !== foods.length) {
      return res.status(400).json({ message: "One or more food IDs are invalid." });
    }

    // Calculate total price
    const totalPrice = foodDocs.reduce((sum, food) => sum + food.price, 0);

    // Create and save order
    const order = new Order({
      customerName,
      foods,
      totalPrice,
    });

    const savedOrder = await order.save();
    res.status(201).json(await savedOrder.populate("foods"));
  } catch (error) {
    res.status(400).json({ message: "Failed to create order", error: error.message });
  }
};
