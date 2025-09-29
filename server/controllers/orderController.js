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


// ✅ DELETE - Delete full order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order", error: error.message });
  }
};




// ✅ DELETE - Remove one food from order
export const deleteOrderItem = async (req, res) => {
  try {
    const { orderId, foodId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Remove the food from the array
    order.foods = order.foods.filter(
      (f) => f.toString() !== foodId.toString()
    );

    // Recalculate total price
    const foodDocs = await Food.find({ _id: { $in: order.foods } });
    order.totalPrice = foodDocs.reduce((sum, food) => sum + food.price, 0);

    const updatedOrder = await order.save();
    res.json({ message: "Food item removed", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove food item", error: error.message });
  }
};
