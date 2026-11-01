import { useCallback, useEffect, useState } from "react";
import { procurement } from "../api/procurement";
import { useSocket } from "./useSocket";

export function useProcurementData() {
  const [data, setData] = useState({ ingredients: [], suppliers: [], orders: [], history: [], summary: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("7");
  const socket = useSocket();
  const reload = useCallback(async () => {
    try {
      const [ingredients, suppliers, orders, history, summary] = await Promise.all([
        procurement.list("ingredients"), procurement.list("suppliers"), procurement.list("purchase-orders"), procurement.list(`ingredients/history?days=${days}`),
        procurement.list(`ingredients/summary?days=${days}`),
      ]);
      setData({ ingredients, suppliers, orders, history, summary });
      setError("");
    } catch (error) { setError(error.response?.data?.message || "Unable to load purchasing data."); }
    finally { setLoading(false); }
  }, [days]);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    socket?.on("ingredients:changed", reload);
    return () => { socket?.off("ingredients:changed", reload); };
  }, [socket, reload]);
  return { ...data, error, setError, loading, reload, days, setDays };
}
