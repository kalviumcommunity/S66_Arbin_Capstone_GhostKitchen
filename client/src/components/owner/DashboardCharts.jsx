import { useState } from "react";
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
import { useThemeStore } from "../../stores/themeStore";
import { formatPrice } from "../../utils/formatPrice";

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip);

const demoSalesByDay = [
  { date: "Sep 08", revenue: 12400, orders: 8 },
  { date: "Sep 09", revenue: 15600, orders: 11 },
  { date: "Sep 10", revenue: 13800, orders: 9 },
  { date: "Sep 11", revenue: 18900, orders: 14 },
  { date: "Sep 12", revenue: 17400, orders: 12 },
  { date: "Sep 13", revenue: 22100, orders: 16 },
  { date: "Sep 14", revenue: 20600, orders: 15 },
  { date: "Sep 15", revenue: 24300, orders: 18 },
  { date: "Sep 16", revenue: 21800, orders: 16 },
  { date: "Sep 17", revenue: 26400, orders: 20 },
  { date: "Sep 18", revenue: 25100, orders: 19 },
  { date: "Sep 19", revenue: 28900, orders: 22 },
  { date: "Sep 20", revenue: 27600, orders: 21 },
  { date: "Sep 21", revenue: 31200, orders: 24 },
];

const demoSalesByStatus = [
  { status: "completed", count: 72 },
  { status: "pending", count: 14 },
  { status: "preparing", count: 9 },
  { status: "cancelled", count: 5 },
];

const demoTopItems = [
  { name: "Chicken Biryani", quantity: 46 },
  { name: "Paneer Tikka", quantity: 38 },
  { name: "Masala Dosa", quantity: 31 },
  { name: "Veg Fried Rice", quantity: 27 },
  { name: "Butter Naan", quantity: 22 },
];

const chartColors = ["#0f766e", "#f59e0b", "#2563eb", "#9333ea", "#e11d48"];

const formatDateLabel = (date) => {
  if (!date) return "";
  if (date.includes("-")) return date.slice(5);
  return date;
};

export default function DashboardCharts({ salesByStatus, salesByDay, topItems }) {
  const theme = useThemeStore((state) => state.theme);
  const [range, setRange] = useState(14);
  const [metric, setMetric] = useState("revenue");
  const isDark = theme !== "light";
  const textColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(148, 163, 184, 0.2)";

  const dailyData = salesByDay.length ? salesByDay : demoSalesByDay;
  const statusData = salesByStatus.length ? salesByStatus : demoSalesByStatus;
  const itemData = topItems.length ? topItems : demoTopItems;
  const visibleDailyData = dailyData.slice(-range);
  const dailyIsDemo = !salesByDay.length;
  const statusIsDemo = !salesByStatus.length;
  const itemsAreDemo = !topItems.length;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { labels: { color: textColor, usePointStyle: true, padding: 18 } },
      tooltip: {
        backgroundColor: isDark ? "#0f172a" : "#0f172a",
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor, drawBorder: false } },
      y: { ticks: { color: textColor }, grid: { color: gridColor, drawBorder: false }, beginAtZero: true },
    },
  };

  const revenueData = {
    labels: visibleDailyData.map((entry) => formatDateLabel(entry.date)),
    datasets: [{
      label: metric === "revenue" ? "Revenue" : "Orders",
      data: visibleDailyData.map((entry) => entry[metric]),
      borderColor: metric === "revenue" ? "#0f766e" : "#2563eb",
      backgroundColor: metric === "revenue" ? "rgba(15, 118, 110, 0.16)" : "rgba(37, 99, 235, 0.14)",
      pointBackgroundColor: metric === "revenue" ? "#0f766e" : "#2563eb",
      pointBorderColor: isDark ? "#1e293b" : "#ffffff",
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 7,
      fill: true,
      tension: 0.35,
    }],
  };

  const revenueOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: { label: (context) => metric === "revenue" ? ` ${formatPrice(context.raw)}` : ` ${context.raw} orders` },
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: { ...chartOptions.scales.y.ticks, callback: (value) => metric === "revenue" ? formatPrice(value).replace(".00", "") : value },
      },
    },
  };

  const statusChartData = {
    labels: statusData.map((entry) => entry.status),
    datasets: [{ data: statusData.map((entry) => entry.count), backgroundColor: chartColors, borderColor: isDark ? "#1e293b" : "#ffffff", borderWidth: 3, hoverOffset: 12 }],
  };

  const statusOptions = {
    ...chartOptions,
    cutout: "65%",
    scales: undefined,
    plugins: {
      ...chartOptions.plugins,
      legend: { ...chartOptions.plugins.legend, position: "bottom" },
    },
  };

  const topItemsChartData = {
    labels: itemData.map((entry) => entry.name),
    datasets: [{ label: "Items sold", data: itemData.map((entry) => entry.quantity), backgroundColor: "#f59e0b", borderRadius: 8, borderSkipped: false, barThickness: 18, hoverBackgroundColor: "#fb923c" }],
  };

  const topItemsOptions = {
    ...chartOptions,
    indexAxis: "y",
    plugins: { ...chartOptions.plugins, legend: { display: false } },
    scales: {
      x: { ...chartOptions.scales.x, ticks: { ...chartOptions.scales.x.ticks, precision: 0 } },
      y: { ...chartOptions.scales.y, grid: { display: false } },
    },
  };

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section className="dashboard-chart-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Performance pulse</h2>
              {dailyIsDemo ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">Demo preview</span> : <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">Live sales</span>}
            </div>
            <p className="mt-1 text-xs text-slate-500">Hover the line to inspect each day.</p>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-700" role="group" aria-label="Performance chart controls">
            {["revenue", "orders"].map((option) => (
              <button key={option} type="button" onClick={() => setMetric(option)} aria-pressed={metric === option} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize transition ${metric === option ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}>
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-64"><Line data={revenueData} options={revenueOptions} /></div>
        <div className="mt-3 flex items-center justify-end gap-1 text-xs text-slate-500">
          <span>Showing</span>
          {[7, 14, 30].map((days) => <button key={days} type="button" onClick={() => setRange(days)} aria-pressed={range === days} className={`rounded-md px-2 py-1 font-semibold transition ${range === days ? "bg-brand-100 text-brand-700" : "hover:bg-slate-100"}`}>{days}d</button>)}
        </div>
      </section>

      <section className="dashboard-chart-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Order momentum</h2>
          {statusIsDemo ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">Demo</span> : null}
        </div>
        <p className="mt-1 text-xs text-slate-500">A quick read on the current order pipeline.</p>
        <div className="mt-4 h-64"><Doughnut data={statusChartData} options={statusOptions} /></div>
      </section>

      <section className="dashboard-chart-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:col-span-2 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">What customers are ordering</h2>
            <p className="mt-1 text-xs text-slate-500">Use this ranking to guide prep and stock decisions.</p>
          </div>
          {itemsAreDemo ? <span className="hidden rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700 sm:inline-flex">Sample demand mix</span> : null}
        </div>
        <div className="mt-4 h-64"><Bar data={topItemsChartData} options={topItemsOptions} /></div>
      </section>
    </div>
  );
}
