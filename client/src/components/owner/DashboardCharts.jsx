import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip);

const colors = ["#0f766e", "#f59e0b", "#2563eb", "#9333ea", "#e11d48"];
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" } },
};

export default function DashboardCharts({ salesByStatus, salesByDay, topItems }) {
  const statusData = {
    labels: salesByStatus.map((entry) => entry.status),
    datasets: [{ data: salesByStatus.map((entry) => entry.count), backgroundColor: colors }],
  };
  const salesData = {
    labels: salesByDay.map((entry) => entry.date),
    datasets: [{ label: "Revenue", data: salesByDay.map((entry) => entry.revenue), borderColor: "#0f766e", backgroundColor: "rgba(15, 118, 110, 0.12)", fill: true, tension: 0.3 }],
  };
  const topItemsData = {
    labels: topItems.map((entry) => entry.name),
    datasets: [{ label: "Items sold", data: topItems.map((entry) => entry.quantity), backgroundColor: "#f59e0b" }],
  };

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Revenue trend</h2>
        <div className="mt-4 h-64">{salesByDay.length ? <Line data={salesData} options={baseOptions} /> : <p className="text-sm text-slate-500">No sales data yet.</p>}</div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Orders by status</h2>
        <div className="mt-4 h-64">{salesByStatus.length ? <Doughnut data={statusData} options={baseOptions} /> : <p className="text-sm text-slate-500">No order data yet.</p>}</div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
        <h2 className="text-lg font-semibold text-slate-900">Top-selling items</h2>
        <div className="mt-4 h-64">{topItems.length ? <Bar data={topItemsData} options={{ ...baseOptions, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} /> : <p className="text-sm text-slate-500">No item sales data yet.</p>}</div>
      </section>
    </div>
  );
}
