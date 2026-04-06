import Food from "../models/foodModel.js";
import Order from "../models/orderModel.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [foodsCount, ordersCount, pendingOrders, completedOrders, revenueAgg, latestOrders] = await Promise.all([
      Food.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "completed" }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate("foods", "name price").lean(),
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const completionRate = ordersCount ? Math.round((completedOrders / ordersCount) * 100) : 0;

    const salesByStatusAgg = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      stats: {
        foodsCount,
        ordersCount,
        pendingOrders,
        completedOrders,
        revenue,
        completionRate,
      },
      salesByStatus: salesByStatusAgg,
      latestOrders,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
};
