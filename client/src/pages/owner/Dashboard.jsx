import { useEffect } from "react";
import StatCard from "../../components/owner/StatCard";
import { useAnalyticsStore } from "../../stores/analyticsStore";
import { formatPrice } from "../../utils/formatPrice";

export default function OwnerDashboard() {
  const stats = useAnalyticsStore((state) => state.stats);
  const salesByStatus = useAnalyticsStore((state) => state.salesByStatus);
  const latestOrders = useAnalyticsStore((state) => state.latestOrders);
  const loading = useAnalyticsStore((state) => state.loading);
  const error = useAnalyticsStore((state) => state.error);
  const fetchDashboard = useAnalyticsStore((state) => state.fetchDashboard);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Owner Dashboard</h1>
      <p className="mt-2 text-slate-600">Overview of kitchen performance and latest orders.</p>

      {loading ? <p className="mt-4 text-slate-600">Loading dashboard...</p> : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}

      {stats ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total Foods" value={stats.foodsCount} />
          <StatCard label="Total Orders" value={stats.ordersCount} />
          <StatCard label="Pending Orders" value={stats.pendingOrders} />
          <StatCard label="Completed Orders" value={stats.completedOrders} />
          <StatCard label="Revenue" value={formatPrice(stats.revenue)} />
          <StatCard label="Completion Rate" value={`${stats.completionRate}%`} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Orders by Status</h2>
          {!salesByStatus.length ? (
            <p className="mt-3 text-sm text-slate-600">No order data yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {salesByStatus.map((entry) => (
                <div key={entry.status} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-sm capitalize text-slate-700">{entry.status}</span>
                  <span className="text-sm font-semibold text-slate-900">{entry.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Latest Orders</h2>
          {!latestOrders.length ? (
            <p className="mt-3 text-sm text-slate-600">No orders yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {latestOrders.map((order) => (
                <div key={order._id} className="rounded-md bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900">#{order._id.slice(-6).toUpperCase()}</span>
                    <span className="capitalize text-slate-600">{order.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
