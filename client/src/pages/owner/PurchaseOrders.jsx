import { useMemo, useState } from "react";

const initialOrders = [
  { id: "PO-1048", date: "Sep 28, 2026", item: "Fresh Salmon", category: "Seafood", vendor: "Northside Foods", unitPrice: 14.5, quantity: 24, status: "Shipped", progress: 75, delivery: "Oct 02, 2026" },
  { id: "PO-1047", date: "Sep 27, 2026", item: "European Butter", category: "Dairy", vendor: "Dairy House", unitPrice: 7.4, quantity: 18, status: "Pending", progress: 50, delivery: "Oct 04, 2026" },
  { id: "PO-1046", date: "Sep 25, 2026", item: "Spaghetti Pasta", category: "Pantry", vendor: "Pasta Prima", unitPrice: 3.4, quantity: 40, status: "Delivered", progress: 100, delivery: "Sep 29, 2026" },
  { id: "PO-1045", date: "Sep 24, 2026", item: "Olive Oil", category: "Pantry", vendor: "Harvest & Co.", unitPrice: 8.2, quantity: 30, status: "Delivered", progress: 100, delivery: "Sep 28, 2026" },
  { id: "PO-1044", date: "Sep 22, 2026", item: "Black Pepper", category: "Pantry", vendor: "Spice Route", unitPrice: 5.8, quantity: 16, status: "Cancelled", progress: 0, delivery: "—" },
  { id: "PO-1043", date: "Sep 20, 2026", item: "Cutting Board", category: "Equipment", vendor: "Kitchen Works", unitPrice: 18, quantity: 12, status: "Shipped", progress: 75, delivery: "Oct 01, 2026" },
];
const initialForm = { supplier: "", item: "", category: "Pantry", quantity: "", unitPrice: "", delivery: "", notes: "", terms: "Net 30" };
const money = (value) => `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PurchaseIcon({ type }) {
  const paths = { search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z", plus: "M12 5v14M5 12h14", close: "M6 6l12 12M18 6 6 18", arrow: "M5 12h13m-5-5 5 5-5 5" };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[type]} /></svg>;
}

export default function OwnerPurchaseOrders() {
  const [orders, setOrders] = useState(initialOrders);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [date, setDate] = useState("Any date");
  const [status, setStatus] = useState("All status");
  const [sort, setSort] = useState("Newest first");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);

  const filtered = useMemo(() => orders.filter((order) => {
    const matchesSearch = !search || `${order.id} ${order.item} ${order.vendor}`.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === "All" || order.status === tab;
    const matchesStatus = status === "All status" || order.status === status;
    const matchesCategory = category === "All categories" || order.category === category;
    return matchesSearch && matchesTab && matchesStatus && matchesCategory;
  }).sort((a, b) => sort === "Total: high to low" ? (b.unitPrice * b.quantity) - (a.unitPrice * a.quantity) : a.id.localeCompare(b.id)), [orders, search, tab, category, status, sort]);

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const saveOrder = (event) => {
    event.preventDefault();
    if (!form.supplier.trim() || !form.item.trim() || !form.quantity || !form.unitPrice) return;
    const next = { id: `PO-${1050 + orders.length}`, date: "Just now", item: form.item, category: form.category, vendor: form.supplier, unitPrice: Number(form.unitPrice), quantity: Number(form.quantity), status: "Pending", progress: 0, delivery: form.delivery || "To be confirmed" };
    setOrders((current) => [next, ...current]); setForm(initialForm); setShowModal(false);
  };
  const receiveOrder = (id) => setOrders((current) => current.map((order) => order.id === id ? { ...order, status: "Delivered", progress: 100 } : order));

  return <div className="purchase-orders-page">
    <div className="purchase-orders-heading"><div><div className="orders-breadcrumb"><span>Dashboard</span><b>/</b><span>Inventory</span><b>/</b><strong>Purchase Orders</strong></div><h1>Purchase Orders</h1><p>Track supplier orders from request to delivery.</p></div><div className="purchase-heading-actions"><label className="purchase-header-search"><PurchaseIcon type="search" /><input aria-label="Search purchase orders" placeholder="Search orders..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="primary-btn" type="button" onClick={() => setShowModal(true)}><PurchaseIcon type="plus" /> Add purchase order</button></div></div>
    <div className="purchase-tabs">{["All", "Pending", "Shipped", "Delivered", "Cancelled"].map((item) => <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>{item === "All" ? orders.length : orders.filter((order) => order.status === item).length}</span></button>)}</div>
    <section className="purchase-toolbar"><label className="purchase-search"><PurchaseIcon type="search" /><input aria-label="Search item or vendor" placeholder="Search item or vendor" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter category"><option>All categories</option><option>Seafood</option><option>Pantry</option><option>Dairy</option><option>Equipment</option></select><select value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filter date"><option>Any date</option><option>This month</option><option>Last month</option></select><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter status"><option>All status</option><option>Pending</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select><select className="purchase-sort" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort purchase orders"><option>Newest first</option><option>Total: high to low</option></select></section>
    <section className="purchase-table-card"><div className="purchase-table-head"><div><h2>Purchase orders</h2><p>{filtered.length} orders in your procurement workspace</p></div><button className="outline-btn" type="button">Export CSV <PurchaseIcon type="arrow" /></button></div><div className="purchase-table-wrap"><table className="purchase-table"><thead><tr><th><input type="checkbox" aria-label="Select all purchase orders" /></th><th>Purchase order</th><th>Date</th><th>Item</th><th>Vendor / supplier</th><th>Unit price</th><th>Qty</th><th>Total</th><th>Status</th><th>Delivery progress</th><th>Expected delivery</th><th>Action</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td><input type="checkbox" aria-label={`Select ${order.id}`} /></td><td><strong className="purchase-id">{order.id}</strong></td><td>{order.date}</td><td><b>{order.item}</b><small>{order.category}</small></td><td>{order.vendor}</td><td>{money(order.unitPrice)}</td><td>{order.quantity}</td><td><strong>{money(order.unitPrice * order.quantity)}</strong></td><td><span className={`purchase-status status-${order.status.toLowerCase()}`}>{order.status}</span></td><td><div className="delivery-cell"><div className="delivery-track"><i style={{ width: `${order.progress}%` }} /></div><b>{order.progress}%</b></div></td><td>{order.delivery}</td><td>{order.status === "Delivered" || order.status === "Cancelled" ? <button className="row-action muted" type="button">View</button> : <button className="row-action" type="button" onClick={() => receiveOrder(order.id)}>Receive</button>}</td></tr>)}</tbody></table></div>{!filtered.length ? <div className="purchase-empty">No purchase orders match these filters.</div> : null}<div className="purchase-table-foot"><span>Showing {filtered.length} of {orders.length} purchase orders</span><div><button type="button" disabled>←</button><button type="button" className="current-page">1</button><button type="button" disabled>→</button></div></div></section>
    {showModal ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowModal(false)}><form className="purchase-modal" onSubmit={saveOrder}><div className="modal-head"><div><h2>Add purchase order</h2><p>Create a supplier order and keep inventory replenishment on track.</p></div><button type="button" className="modal-close" aria-label="Close modal" onClick={() => setShowModal(false)}><PurchaseIcon type="close" /></button></div><div className="purchase-form-grid"><label>Supplier<input name="supplier" value={form.supplier} onChange={updateForm} placeholder="e.g. Northside Foods" required /></label><label>Item<input name="item" value={form.item} onChange={updateForm} placeholder="e.g. Fresh Salmon" required /></label><label>Category<select name="category" value={form.category} onChange={updateForm}><option>Pantry</option><option>Seafood</option><option>Dairy</option><option>Equipment</option><option>Cleaning</option></select></label><label>Quantity<input name="quantity" type="number" min="1" value={form.quantity} onChange={updateForm} placeholder="0" required /></label><label>Unit price<input name="unitPrice" type="number" min="0" step="0.01" value={form.unitPrice} onChange={updateForm} placeholder="$0.00" required /></label><label>Expected delivery<input name="delivery" type="date" value={form.delivery} onChange={updateForm} /></label><label>Payment terms<select name="terms" value={form.terms} onChange={updateForm}><option>Net 30</option><option>Net 15</option><option>Due on delivery</option><option>Prepaid</option></select></label><label className="purchase-total-field">Estimated total<strong>{money(Number(form.unitPrice || 0) * Number(form.quantity || 0))}</strong></label><label className="purchase-notes">Notes<textarea name="notes" value={form.notes} onChange={updateForm} placeholder="Add delivery instructions or supplier notes..." rows="3" /></label></div><div className="modal-actions"><button className="outline-btn" type="button" onClick={() => setShowModal(false)}>Cancel</button><button className="primary-btn" type="submit">Save purchase order</button></div></form></div> : null}
  </div>;
}
