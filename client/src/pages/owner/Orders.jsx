import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useOwnerOrderStore } from "../../stores/ownerOrderStore";
import { getOrderItems } from "../../utils/orderItems";
import { formatPrice } from "../../utils/formatPrice";
import { payments } from "../../api/payments";
import { downloadFile } from "../../utils/download";

const statusLabels = { completed: "Completed", preparing: "On Process", cancelled: "Cancelled", pending: "Pending", ready: "Ready" };
const actionLabels = { preparing: "Start preparing", ready: "Mark ready", completed: "Mark completed", cancelled: "Cancel order" };
const orderId = (value) => `#${String(value || "order").slice(-5).toUpperCase()}`;
const quantity = (items) => items.reduce((total, item) => total + item.quantity, 0);
const orderType = (order) => order.orderType || (String(order.address || "").toLowerCase().includes("table") ? "Dine-in" : "Online");
const initials = (name) => String(name || "Guest").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

function MiniIcon({ type }) {
  const paths = { orders: "M6 8V6a6 6 0 0 1 12 0v2M4 8h16l-1 12H5L4 8Z", pending: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", completed: "m5 12 4 4L19 6", cancelled: "M7 7l10 10M17 7 7 17" };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[type]} /></svg>;
}

function OrderChart() {
  return <div className="orders-chart"><div className="orders-chart-y"><span>240</span><span>180</span><span>120</span><span>60</span><span>0</span></div><svg viewBox="0 0 620 170" preserveAspectRatio="none" role="img" aria-label="Orders over time chart"><defs><linearGradient id="ordersFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e96d32" stopOpacity=".24" /><stop offset="1" stopColor="#e96d32" stopOpacity="0" /></linearGradient></defs><path d="M0 141 C40 132 50 112 92 119 S143 76 181 90 S229 57 266 82 S317 96 351 52 S397 77 435 46 S480 61 521 24 S571 49 620 10 L620 170 L0 170Z" fill="url(#ordersFill)" /><path d="M0 141 C40 132 50 112 92 119 S143 76 181 90 S229 57 266 82 S317 96 351 52 S397 77 435 46 S480 61 521 24 S571 49 620 10" fill="none" stroke="#e96d32" strokeWidth="3" strokeLinecap="round" /><circle cx="521" cy="24" r="5" fill="#fff" stroke="#e96d32" strokeWidth="3" /></svg><div className="orders-chart-x"><span>Sep 01</span><span>Sep 07</span><span>Sep 14</span><span>Sep 21</span><span>Sep 26</span></div></div>;
}

export default function OwnerOrders() {
  const [searchParams] = useSearchParams();
  const orders = useOwnerOrderStore((state) => state.orders);
  const loading = useOwnerOrderStore((state) => state.loading);
  const error = useOwnerOrderStore((state) => state.error);
  const fetchOrders = useOwnerOrderStore((state) => state.fetchOrders);
  const updateStatus = useOwnerOrderStore((state) => state.updateStatus);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [sort, setSort] = useState("Newest first");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [period, setPeriod] = useState("This month");

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const rows = orders.map((order) => ({ ...order, displayItems: getOrderItems(order) }));
  const filtered = rows.filter((order) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || [order._id, order.customerName, order.address, orderType(order), ...order.displayItems.map((item) => item.name)].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All status" || statusLabels[order.status] === statusFilter;
    const matchesType = typeFilter === "All types" || orderType(order) === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => sort === "Newest first" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * 5, currentPage * 5);
  const counts = rows.reduce((result, order) => { result[order.status] = (result[order.status] || 0) + 1; return result; }, {});
  const detail = rows.find((order) => order._id === detailId);
  const allSelected = pageRows.length > 0 && pageRows.every((order) => selected.includes(order._id));

  const toggleSelected = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleAll = () => setSelected(allSelected ? [] : pageRows.map((order) => order._id));
  const changeStatus = async (order, status) => {
    if (updatingId) return;
    setOpenMenu(null);
    setUpdatingId(order._id);
    setActionError("");
    try { await updateStatus(order._id, status); }
    catch (error) { setActionError(error.message); await fetchOrders(); }
    finally { setUpdatingId(null); }
  };
  const paymentAction = async (order, action) => {
    if (updatingId) return;
    setUpdatingId(order?._id || "maintenance"); setActionError("");
    try {
      if (action === "receipt") await downloadFile(`/payments/${order._id}/receipt`, `receipt-GK-${order._id}.html`);
      else if (action === "maintenance") await payments.maintenance();
      else await payments[action](order._id);
      await fetchOrders();
    } catch (error) { setActionError(error.response?.data?.message || error.message || "Payment action failed."); }
    finally { setUpdatingId(null); }
  };

  return <div className="orders-page">
    <div className="page-heading">
      <div><div className="orders-breadcrumb"><span>Dashboard</span><b>/</b><strong>Orders</strong></div><h1>Orders <span className="live-pill"><i /> Live</span></h1><p>Track, manage, and fulfill every order from one place.</p></div>
      <button type="button" className="outline-btn" disabled={updatingId !== null} onClick={() => paymentAction(null, "maintenance")}>Reconcile payments & expired checkouts</button>
    </div>

    <section className="order-summary-grid">
      {[
        ["orders", "Total orders", rows.length, "orange"],
        ["pending", "Pending orders", counts.pending || 0, "purple"],
        ["completed", "Completed orders", counts.completed || 0, "green"],
        ["cancelled", "Cancelled orders", counts.cancelled || 0, "red"],
      ].map(([type, label, count, color]) => <article className="order-summary-card" key={type}>
        <div><span>{label}</span><strong>{count}</strong></div>
        <span className={`summary-icon summary-${color}`}><MiniIcon type={type} /></span>
      </article>)}
    </section>

    <section className="orders-analytics-grid"><article className="panel orders-overview-panel"><div className="panel-head"><div><h2>Orders overview</h2><p>Order volume over the selected period</p></div><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Orders overview period"><option>This month</option><option>Last month</option><option>This year</option></select></div><div className="orders-chart-total"><strong>1,248</strong><span>orders</span><b>+12.5%</b><small>vs 1,108 last month</small></div><OrderChart /></article><article className="panel order-type-panel"><div className="panel-head"><div><h2>Order types</h2><p>Breakdown by fulfillment method</p></div><button className="dots" type="button">•••</button></div><div className="order-type-body"><div className="orders-donut"><div><strong>1,248</strong><small>Total</small></div></div><div className="order-type-list"><span><i className="type-dine" />Dine-in <b>524 <small>42%</small></b></span><span><i className="type-take" />Takeaway <b>375 <small>30%</small></b></span><span><i className="type-online" />Online <b>349 <small>28%</small></b></span></div></div></article></section>

    {loading ? <p role="status">Loading orders...</p> : null}
    {error || actionError ? <p role="alert" className="rounded-md bg-red-50 p-3 text-red-700">{actionError || error}</p> : null}

    {detail ? <section className="panel p-5" aria-label="Order details">
      <div className="panel-head"><h2>Order {orderId(detail._id)}</h2><button type="button" className="outline-btn" onClick={() => setDetailId(null)}>Close details</button></div>
      <p>{detail.customerName} · {statusLabels[detail.status]}</p>
      <ul className="my-3 space-y-2">{detail.displayItems.map((item) => <li key={item.foodId}>
        {item.name} × {item.quantity}{item.unitPrice !== null ? ` @ ${formatPrice(item.unitPrice)} = ${formatPrice(item.lineTotal)}` : ""}
      </li>)}</ul>
      {!detail.items?.length ? <p className="text-sm">Legacy order: original item prices are unavailable.</p> : null}
      <strong>Total: {formatPrice(detail.totalPrice)}</strong>
      <p className="my-3">{detail.paymentMethod === "razorpay" ? "Razorpay test mode" : "Cash on delivery"} · Payment: {(detail.paymentStatus || "unpaid").replaceAll("_", " ")}</p>
      {detail.payment?.paymentId ? <p className="text-sm">Transaction: {detail.payment.paymentId}</p> : null}
      {detail.payment?.refundStatus ? <p className="text-sm">Refund: {detail.payment.refundStatus} {detail.payment.refundId || ""}</p> : null}
      {detail.payment?.refundError ? <p role="status" className="text-sm text-red-700">{detail.payment.refundError}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {detail.paymentMethod === "cod" && detail.paymentStatus === "unpaid" && ["ready", "completed"].includes(detail.status) ? <button type="button" className="primary-btn" disabled={updatingId !== null} onClick={() => paymentAction(detail, "collectCash")}>Record cash collected</button> : null}
        {detail.paymentMethod === "razorpay" ? <button type="button" className="outline-btn" disabled={updatingId !== null} onClick={() => paymentAction(detail, "reconcile")}>Check payment / refund</button> : null}
        {["refund_failed", "refund_pending"].includes(detail.paymentStatus) ? <button type="button" className="primary-btn" disabled={updatingId !== null} onClick={() => paymentAction(detail, "refund")}>Retry / reconcile full refund</button> : null}
        {detail.receiptAvailable ? <button type="button" className="outline-btn" disabled={updatingId !== null} onClick={() => paymentAction(detail, "receipt")}>Download receipt</button> : null}
      </div>
    </section> : null}

    <section className="panel orders-table-panel">
      <div className="orders-table-head"><div><h2>All orders <span>{filtered.length} total</span></h2><p>Review and manage incoming orders</p></div></div>
      <div className="orders-controls">
        <label className="orders-search"><span>⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search orders..." aria-label="Search orders" /></label>
        <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter by status">
          <option>All status</option>{Object.values(statusLabels).map((status) => <option key={status}>{status}</option>)}
        </select>
        <select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} aria-label="Filter by order type"><option>All types</option><option>Dine-in</option><option>Takeaway</option><option>Online</option></select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort orders"><option>Newest first</option><option>Oldest first</option></select>
      </div>
      <div className="orders-table-scroll"><table className="orders-data-table">
        <thead><tr><th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all visible orders" /></th><th>Order ID</th><th>Date</th><th>Customer</th><th>Order type</th><th>Address</th><th>Items / Qty</th><th>Amount</th><th>Status</th><th aria-label="Actions" /></tr></thead>
        <tbody>{pageRows.map((order) => <tr key={order._id}>
          <td><input type="checkbox" checked={selected.includes(order._id)} onChange={() => toggleSelected(order._id)} aria-label={`Select ${orderId(order._id)}`} /></td>
          <td><b className="order-table-id">{orderId(order._id)}</b></td>
          <td>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}<small className="order-time">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></td>
          <td><span className="customer-cell"><i>{initials(order.customerName)}</i><b>{order.customerName || "Guest"}</b></span></td>
          <td><span className={`type-label type-${orderType(order).toLowerCase()}`}>{orderType(order)}</span></td>
          <td className="address-cell">{order.address || "—"}</td>
          <td><b>{order.displayItems[0]?.name || "Unavailable menu item"}</b><small className="order-time">{quantity(order.displayItems)} {quantity(order.displayItems) === 1 ? "item" : "items"}</small></td>
          <td><b className="amount-cell">{formatPrice(order.totalPrice)}</b><small className="order-time">{order.paymentMethod === "razorpay" ? "Online" : "COD"} · {(order.paymentStatus || "unpaid").replaceAll("_", " ")}</small></td>
          <td><span className={`status status-${order.status}`}>{statusLabels[order.status] || order.status}</span></td>
          <td className="action-cell">
            <button type="button" className="row-menu-button" disabled={updatingId !== null} aria-label={`Actions for ${orderId(order._id)}`} aria-expanded={openMenu === order._id} onClick={() => setOpenMenu(openMenu === order._id ? null : order._id)}>•••</button>
            {openMenu === order._id ? <div className="row-menu">
              {(order.allowedStatuses || []).map((status) => <button key={status} type="button" onClick={() => changeStatus(order, status)}>{actionLabels[status]}</button>)}
              <button type="button" onClick={() => { setDetailId(order._id); setOpenMenu(null); }}>View details</button>
            </div> : null}
          </td>
        </tr>)}</tbody>
      </table>{!loading && !pageRows.length ? <div className="orders-empty">No orders match these filters.</div> : null}</div>
      <div className="orders-pagination">
        <span>Rows per page <b>5</b></span><span>Showing {filtered.length ? (currentPage - 1) * 5 + 1 : 0}-{Math.min(currentPage * 5, filtered.length)} of {filtered.length}</span>
        <div><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: totalPages }, (_, index) => <button key={index + 1} className={currentPage === index + 1 ? "current" : ""} type="button" onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>›</button></div>
      </div>
    </section>
  </div>;
}
