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

    const [salesByStatusAgg, salesByDay, topItems] = await Promise.all([
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$foods" },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: { $divide: ["$totalPrice", { $size: "$foods" }] } }, orders: { $sum: 1 } } },
        { $project: { _id: 0, date: "$_id", revenue: { $round: ["$revenue", 2] }, orders: 1 } },
        { $sort: { date: 1 } },
        { $limit: 30 },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$foods" },
        { $group: { _id: "$foods", quantity: { $sum: 1 } } },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
        { $lookup: { from: "foods", localField: "_id", foreignField: "_id", as: "food" } },
        { $unwind: "$food" },
        { $project: { _id: 0, name: "$food.name", quantity: 1 } },
      ]),
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
      salesByDay,
      topItems,
      latestOrders,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
};
