import { emitToOwners, emitToUser } from "../socket/socketServer.js";
import { orderActions } from "./orderPolicy.js";

export async function publishOrder(order, message = "Order payment updated") {
  await order.populate("foods");
  emitToOwners("owner:order:updated", { order: orderActions(order, "owner"), message });
  emitToUser(order.userId, "customer:order:updated", { order: orderActions(order, "customer"), message });
  if (order.status === "cancelled") emitToOwners("inventory:changed", { source: "order_cancelled", orderId: order._id });
}
