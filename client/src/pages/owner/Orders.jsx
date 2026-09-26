import { useEffect, useState } from "react";
import { useOwnerOrderStore } from "../../stores/ownerOrderStore";

const demoOrders = [
  { _id: "GH48291", createdAt: "2026-09-26T11:32:00", customerName: "Olivia Bennett", orderType: "Dine-in", address: "Table 08", foods: [{ name: "Truffle Pasta", quantity: 2 }], totalPrice: 36, status: "completed" },
  { _id: "GH48290", createdAt: "2026-09-26T11:14:00", customerName: "Ethan Carter", orderType: "Takeaway", address: "Pickup counter", foods: [{ name: "Chicken Burger", quantity: 1 }], totalPrice: 14.5, status: "preparing" },
  { _id: "GH48289", createdAt: "2026-09-26T10:58:00", customerName: "Sophia Wilson", orderType: "Online", address: "24 Park Avenue", foods: [{ name: "Salmon Bowl", quantity: 2 }, { name: "Iced Tea", quantity: 1 }], totalPrice: 32, status: "completed" },
  { _id: "GH48288", createdAt: "2026-09-26T10:42:00", customerName: "James Anderson", orderType: "Dine-in", address: "Table 14", foods: [{ name: "Margherita Pizza", quantity: 1 }], totalPrice: 15, status: "cancelled" },
  { _id: "GH48287", createdAt: "2026-09-26T10:21:00", customerName: "Mia Thompson", orderType: "Online", address: "81 Oak Street", foods: [{ name: "Chocolate Lava Cake", quantity: 3 }], totalPrice: 21, status: "completed" },
  { _id: "GH48286", createdAt: "2026-09-26T09:54:00", customerName: "Noah Williams", orderType: "Takeaway", address: "Pickup counter", foods: [{ name: "Spicy Ramen", quantity: 1 }], totalPrice: 17.5, status: "pending" },
  { _id: "GH48285", createdAt: "2026-09-26T09:31:00", customerName: "Ava Martinez", orderType: "Dine-in", address: "Table 03", foods: [{ name: "Seafood Risotto", quantity: 2 }], totalPrice: 42, status: "completed" },
  { _id: "GH48284", createdAt: "2026-09-26T09:12:00", customerName: "Liam Brown", orderType: "Online", address: "12 River Road", foods: [{ name: "Crispy Chicken", quantity: 1 }, { name: "Fries", quantity: 1 }], totalPrice: 19.5, status: "preparing" },
];

const statusLabels = { completed: "Completed", preparing: "On Process", cancelled: "Cancelled", pending: "Pending", ready: "Ready" };
const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const orderId = (value) => `#${String(value || "order").slice(-5).toUpperCase()}`;
const quantity = (foods = []) => foods.reduce((total, food) => total + Number(food.quantity || 1), 0);

function MiniIcon({ type }) {
  const paths = { orders: "M6 8V6a6 6 0 0 1 12 0v2M4 8h16l-1 12H5L4 8Z", pending: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", completed: "m5 12 4 4L19 6", cancelled: "M7 7l10 10M17 7 7 17" };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[type]} /></svg>;
}

function OrderChart() {
  return <div className="orders-chart"><div className="orders-chart-y"><span>240</span><span>180</span><span>120</span><span>60</span><span>0</span></div><svg viewBox="0 0 620 170" preserveAspectRatio="none" role="img" aria-label="Orders over time chart"><defs><linearGradient id="ordersFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e96d32" stopOpacity=".24" /><stop offset="1" stopColor="#e96d32" stopOpacity="0" /></linearGradient></defs><path d="M0 141 C40 132 50 112 92 119 S143 76 181 90 S229 57 266 82 S317 96 351 52 S397 77 435 46 S480 61 521 24 S571 49 620 10 L620 170 L0 170Z" fill="url(#ordersFill)" /><path d="M0 141 C40 132 50 112 92 119 S143 76 181 90 S229 57 266 82 S317 96 351 52 S397 77 435 46 S480 61 521 24 S571 49 620 10" fill="none" stroke="#e96d32" strokeWidth="3" strokeLinecap="round" /><circle cx="521" cy="24" r="5" fill="#fff" stroke="#e96d32" strokeWidth="3" /></svg><div className="orders-chart-x"><span>Sep 01</span><span>Sep 07</span><span>Sep 14</span><span>Sep 21</span><span>Sep 26</span></div></div>;
}

export default function OwnerOrders() {
  const orders = useOwnerOrderStore((state) => state.orders);
  const fetchOrders = useOwnerOrderStore((state) => state.fetchOrders);
  const updateStatus = useOwnerOrderStore((state) => state.updateStatus);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [sort, setSort] = useState("Newest first");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [period, setPeriod] = useState("This month");

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const rows = orders.length ? orders : demoOrders;
  const filtered = rows.filter((order) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || [order._id, order.customerName, order.address, ...(order.foods || []).map((food) => food.name)].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All status" || statusLabels[order.status] === statusFilter;
    const matchesType = typeFilter === "All types" || order.orderType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => sort === "Newest first" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));
  const pageRows = filtered.slice((page - 1) * 5, page * 5);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  const counts = rows.reduce((result, order) => { result[order.status] = (result[order.status] || 0) + 1; return result; }, {});

  const toggleSelected = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleAll = () => setSelected(selected.length === pageRows.length ? [] : pageRows.map((order) => order._id));
  const changeStatus = async (order, status) => { setOpenMenu(null); if (orders.length) await updateStatus(order._id, status); };

  return <div className="orders-page">
    <div className="page-heading"><div><div className="orders-breadcrumb"><span>Dashboard</span><b>/</b><strong>Orders</strong></div><h1>Orders <span className="live-pill"><i /> Live</span></h1><p>Track, manage, and fulfill every order from one place.</p></div><div className="heading-actions"><button className="outline-btn" type="button">↓ <span>Export orders</span></button><button className="primary-btn" type="button">＋ New order</button></div></div>

    <section className="order-summary-grid"><article className="order-summary-card"><div><span>Total orders</span><strong>{rows.length === demoOrders.length ? "1,248" : rows.length}</strong><small className="trend-up">↗ 12.5% <em>vs last month</em></small></div><span className="summary-icon summary-orange"><MiniIcon type="orders" /></span></article><article className="order-summary-card"><div><span>Pending orders</span><strong>{rows.length === demoOrders.length ? "24" : (counts.pending || 0)}</strong><small className="trend-up">↗ 3.2% <em>vs last month</em></small></div><span className="summary-icon summary-purple"><MiniIcon type="pending" /></span></article><article className="order-summary-card"><div><span>Completed orders</span><strong>{rows.length === demoOrders.length ? "1,184" : (counts.completed || 0)}</strong><small className="trend-up">↗ 15.8% <em>vs last month</em></small></div><span className="summary-icon summary-green"><MiniIcon type="completed" /></span></article><article className="order-summary-card"><div><span>Cancelled orders</span><strong>{rows.length === demoOrders.length ? "40" : (counts.cancelled || 0)}</strong><small className="trend-down">↘ 2.1% <em>vs last month</em></small></div><span className="summary-icon summary-red"><MiniIcon type="cancelled" /></span></article></section>

    <section className="orders-analytics-grid"><article className="panel orders-overview-panel"><div className="panel-head"><div><h2>Orders overview</h2><p>Order volume over the selected period</p></div><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Orders overview period"><option>This month</option><option>Last month</option><option>This year</option></select></div><div className="orders-chart-total"><strong>1,248</strong><span>orders</span><b>+12.5%</b><small>vs 1,108 last month</small></div><OrderChart /></article><article className="panel order-type-panel"><div className="panel-head"><div><h2>Order types</h2><p>Breakdown by fulfillment method</p></div><button className="dots" type="button">•••</button></div><div className="order-type-body"><div className="orders-donut"><div><strong>1,248</strong><small>Total</small></div></div><div className="order-type-list"><span><i className="type-dine" />Dine-in <b>524 <small>42%</small></b></span><span><i className="type-take" />Takeaway <b>375 <small>30%</small></b></span><span><i className="type-online" />Online <b>349 <small>28%</small></b></span></div></div></article></section>

    <section className="panel orders-table-panel"><div className="orders-table-head"><div><h2>All orders <span>{filtered.length} total</span></h2><p>Review and manage incoming orders</p></div><div className="table-head-actions"><button className="outline-btn" type="button">↓ Export</button></div></div><div className="orders-controls"><label className="orders-search"><span>⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search orders..." aria-label="Search orders" /></label><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter by status"><option>All status</option><option>Completed</option><option>On Process</option><option>Pending</option><option>Cancelled</option></select><select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} aria-label="Filter by order type"><option>All types</option><option>Dine-in</option><option>Takeaway</option><option>Online</option></select><button className="filter-date" type="button">▣ <span>Sep 01 – Sep 26</span></button><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort orders"><option>Newest first</option><option>Oldest first</option></select></div><div className="orders-table-scroll"><table className="orders-data-table"><thead><tr><th><input type="checkbox" checked={pageRows.length > 0 && selected.length === pageRows.length} onChange={toggleAll} aria-label="Select all visible orders" /></th><th>Order ID</th><th>Date</th><th>Customer</th><th>Order type</th><th>Address</th><th>Items / Qty</th><th>Amount</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{pageRows.map((order) => <tr key={order._id}><td><input type="checkbox" checked={selected.includes(order._id)} onChange={() => toggleSelected(order._id)} aria-label={`Select ${orderId(order._id)}`} /></td><td><b className="order-table-id">{orderId(order._id)}</b></td><td>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}<small className="order-time">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></td><td><span className="customer-cell"><i>{order.customerName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i><b>{order.customerName}</b></span></td><td><span className={`type-label type-${order.orderType.toLowerCase()}`}>{order.orderType}</span></td><td className="address-cell">{order.address}</td><td><b>{order.foods?.[0]?.name || "Multiple items"}</b><small className="order-time">{quantity(order.foods)} {quantity(order.foods) === 1 ? "item" : "items"}</small></td><td><b className="amount-cell">{money(order.totalPrice)}</b></td><td><span className={`status status-${order.status}`}>{statusLabels[order.status] || order.status}</span></td><td className="action-cell"><button type="button" className="row-menu-button" aria-label={`Actions for ${orderId(order._id)}`} onClick={() => setOpenMenu(openMenu === order._id ? null : order._id)}>•••</button>{openMenu === order._id ? <div className="row-menu"><button type="button" onClick={() => changeStatus(order, "completed")}>Mark completed</button><button type="button" onClick={() => changeStatus(order, "preparing")}>Move to process</button><button type="button" onClick={() => setOpenMenu(null)}>View details</button></div> : null}</td></tr>)}</tbody></table>{!pageRows.length ? <div className="orders-empty">No orders match these filters.</div> : null}</div><div className="orders-pagination"><span>Rows per page <b>5</b>⌄</span><span>Showing {filtered.length ? (page - 1) * 5 + 1 : 0}-{Math.min(page * 5, filtered.length)} of {filtered.length}</span><div><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>‹</button>{Array.from({ length: totalPages }, (_, index) => <button key={index + 1} className={page === index + 1 ? "current" : ""} type="button" onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>›</button></div></div></section>
  </div>;
}
