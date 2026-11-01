import { useState } from "react";
import { Link } from "react-router-dom";
import { procurement } from "../../api/procurement";
import { useProcurementData } from "../../hooks/useProcurementData";
import WorkspaceDialog from "../../components/owner/WorkspaceDialog";
import { formatPrice } from "../../utils/formatPrice";
import { downloadFile } from "../../utils/download";

const statusLabel = (value) => value.replaceAll("_", " ");
const emptySupplier = { name: "", contactName: "", email: "", phone: "", address: "", notes: "", active: true };
const newLine = () => ({ ingredientId: "", quantity: "", unitPrice: "" });
const emptyOrder = () => ({ supplierId: "", expectedDelivery: "", notes: "", lines: [newLine()] });

export default function OwnerPurchaseOrders() {
  const { orders, suppliers, ingredients, error, setError, loading, reload } = useProcurementData();
  const [tab, setTab] = useState("orders");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(emptyOrder);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [receipt, setReceipt] = useState({});
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const open = (kind, order) => {
    setDialogError(""); setDialog({ kind, order, key: crypto.randomUUID() });
    if (kind === "supplier") setSupplierForm(order ? { ...order } : emptySupplier);
    else if (kind === "order") setForm(order ? {
      supplierId: order.supplierId, expectedDelivery: order.expectedDelivery?.slice(0, 10) || "", notes: order.notes || "",
      lines: order.lines.map((line) => ({ ingredientId: line.ingredientId, quantity: line.quantity, unitPrice: line.unitPricePaise / 100 })),
    } : emptyOrder());
    else if (kind === "receive") setReceipt(Object.fromEntries(order.lines.map((line) => [line._id, ""])));
  };
  const run = async (operation) => {
    setBusy(true); setError("");
    try { await operation(); await reload(); }
    catch (error) { setError(error.response?.data?.message || error.message || "Unable to complete this operation."); }
    finally { setBusy(false); }
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setDialogError("");
    try {
      if (dialog.kind === "supplier") await procurement.save("suppliers", supplierForm, dialog.order?._id);
      else if (dialog.kind === "order") await procurement.save("purchase-orders", {
        ...form, lines: form.lines.map((line) => ({ ...line, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) })),
      }, dialog.order?._id);
      else if (dialog.kind === "receive") {
        const lines = Object.entries(receipt).filter(([, quantity]) => Number(quantity) > 0).map(([lineId, quantity]) => ({ lineId, quantity: Number(quantity) }));
        if (!lines.length) throw new Error("Enter at least one received quantity.");
        await procurement.receive(dialog.order._id, lines, dialog.key);
      }
      setDialog(null); await reload();
    } catch (error) { setDialogError(error.response?.data?.message || error.message || "Unable to save."); }
    finally { setBusy(false); }
  };
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const changeLine = (index, field, value) => setForm((current) => ({ ...current, lines: current.lines.map((line, idx) => idx === index ? { ...line, [field]: value } : line) }));
  const filtered = orders.filter((order) => (status === "all" || order.status === status) && `${order._id} ${order.supplierName} ${order.lines.map((line) => line.name).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const visibleSuppliers = suppliers.filter((supplier) => `${supplier.name} ${supplier.contactName} ${supplier.email}`.toLowerCase().includes(search.toLowerCase()));
  const estimatedPaise = form.lines.reduce((sum, line) => sum + Math.round(Math.round(Number(line.unitPrice || 0) * 100) * Number(line.quantity || 0)), 0);
  return <div className="purchase-orders-page">
    <div className="purchase-orders-heading"><div><div className="orders-breadcrumb"><span>Inventory</span><b>/</b><strong>Purchasing</strong></div><h1>Purchasing & suppliers</h1><p>Plan replenishment, receive deliveries, and keep supplier records in one place.</p></div><div className="purchase-heading-actions"><Link className="outline-btn" to="/owner/inventory">Ingredient stock & usage</Link><button className="primary-btn" type="button" onClick={() => open(tab === "orders" ? "order" : "supplier")}>{tab === "orders" ? "Add purchase order" : "Add supplier"}</button></div></div>
    <div className="purchase-tabs"><button type="button" className={tab === "orders" ? "active" : ""} onClick={() => { setTab("orders"); setSearch(""); }}>Purchase orders <span>{orders.length}</span></button><button type="button" className={tab === "suppliers" ? "active" : ""} onClick={() => { setTab("suppliers"); setSearch(""); }}>Suppliers <span>{suppliers.length}</span></button></div>
    {loading ? <p role="status">Loading purchasing data…</p> : null}
    {error ? <p role="alert" className="my-3 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}
    <section className="purchase-toolbar procurement-controls"><input aria-label="Search purchasing" placeholder={tab === "orders" ? "Search order, ingredient or supplier" : "Search suppliers"} value={search} onChange={(event) => setSearch(event.target.value)} />{tab === "orders" ? <select aria-label="Purchase order status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{["pending", "ordered", "partially_received", "received", "cancelled"].map((value) => <option value={value} key={value}>{statusLabel(value)}</option>)}</select> : null}<button type="button" className="outline-btn" disabled={busy} onClick={() => run(reload)}>Refresh</button>{tab === "orders" ? <button type="button" className="outline-btn" disabled={busy} onClick={() => run(() => downloadFile("/procurement/purchase-orders/export", "purchase-orders.csv"))}>Export CSV</button> : null}</section>
    <section className="purchase-table-card"><div className="purchase-table-head"><div><h2>{tab === "orders" ? "Purchase orders" : "Supplier directory"}</h2><p>{tab === "orders" ? "Submit a purchase order before receiving partial or full deliveries." : "Archived suppliers stay linked to historical purchases."}</p></div></div><div className="purchase-table-wrap">
      {tab === "orders" ? <table className="purchase-table"><thead><tr><th>Purchase order</th><th>Supplier</th><th>Ingredients</th><th>Expected delivery</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((order) => <tr key={order._id}>
        <td><b>PO-{order._id.slice(-6).toUpperCase()}</b><small>{new Date(order.createdAt).toLocaleDateString()}</small></td><td>{order.supplierName}</td><td>{order.lines.map((line) => <small key={line._id}>{line.name}: {line.receivedQuantity}/{line.quantity} {line.unit} received</small>)}</td><td>{order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : "Not specified"}</td><td>{formatPrice(order.totalPaise / 100)}</td><td className="capitalize">{statusLabel(order.status)}</td><td><div className="flex flex-wrap gap-2">
          <button type="button" className="row-action" onClick={() => open("view", order)}>Details</button>
          {order.status === "pending" ? <><button type="button" className="row-action" onClick={() => open("order", order)}>Edit</button><button type="button" className="row-action" disabled={busy} onClick={() => run(() => procurement.setStatus(order._id, "ordered"))}>Submit order</button></> : null}
          {["ordered", "partially_received"].includes(order.status) ? <button type="button" className="row-action" onClick={() => open("receive", order)}>Receive delivery</button> : null}
          {["pending", "ordered", "partially_received"].includes(order.status) ? <button type="button" className="row-action" disabled={busy} onClick={() => run(() => procurement.setStatus(order._id, "cancelled"))}>{order.status === "partially_received" ? "Cancel remaining" : "Cancel"}</button> : null}
        </div></td>
      </tr>)}</tbody></table> : <table className="purchase-table"><thead><tr><th>Supplier</th><th>Contact</th><th>Email / phone</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visibleSuppliers.map((supplier) => <tr key={supplier._id}><td><b>{supplier.name}</b></td><td>{supplier.contactName || "—"}</td><td>{supplier.email || "—"}<small>{supplier.phone}</small></td><td>{supplier.address || "—"}</td><td>{supplier.active ? "Active" : "Archived"}</td><td><div className="flex gap-2"><button className="row-action" type="button" onClick={() => open("supplier", supplier)}>Edit</button><button className="row-action" type="button" disabled={busy} onClick={() => run(() => supplier.active ? procurement.archive("suppliers", supplier._id) : procurement.save("suppliers", { ...supplier, active: true }, supplier._id))}>{supplier.active ? "Archive" : "Restore"}</button></div></td></tr>)}</tbody></table>}
    </div>{!(tab === "orders" ? filtered : visibleSuppliers).length && !loading ? <div className="purchase-empty">{tab === "orders" ? "No purchase orders yet. Add a supplier and an ingredient, then create a purchase order." : "No suppliers found. Add your first supplier to begin."}</div> : null}</section>
    {dialog ? <WorkspaceDialog title={dialog.kind === "supplier" ? dialog.order ? "Edit supplier" : "Add supplier" : dialog.kind === "receive" ? "Receive delivery" : dialog.kind === "view" ? "Purchase order details" : dialog.order ? "Edit purchase order" : "Add purchase order"} onClose={() => setDialog(null)} onSubmit={dialog.kind === "view" ? undefined : save} busy={busy} error={dialogError} submitLabel={dialog.kind === "receive" ? "Record delivery" : "Save"}>
      {dialog.kind === "supplier" ? <div className="purchase-form-grid">{[["name", "Supplier name", "text", 120], ["contactName", "Contact person", "text", 120], ["email", "Email", "email", 254], ["phone", "Phone", "tel", 40], ["address", "Address", "text", 500], ["notes", "Notes", "text", 1000]].map(([name, label, type, max]) => <label key={name}>{label}<input name={name} type={type} maxLength={max} required={name === "name"} value={supplierForm[name] || ""} onChange={(event) => setSupplierForm((current) => ({ ...current, [name]: event.target.value }))} /></label>)}</div> : null}
      {dialog.kind === "order" ? <>
        <div className="purchase-form-grid"><label>Supplier<select name="supplierId" required value={form.supplierId} onChange={change}><option value="">Select supplier</option>{suppliers.filter((supplier) => supplier.active).map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}</select></label><label>Expected delivery<input name="expectedDelivery" type="date" value={form.expectedDelivery} onChange={change} /></label></div>
        <div className="my-4 space-y-3">{form.lines.map((line, index) => <div className="procurement-line" key={index}>
          <label>Ingredient<select aria-label={`Ingredient ${index + 1}`} required value={line.ingredientId} onChange={(event) => changeLine(index, "ingredientId", event.target.value)}><option value="">Select ingredient</option>{ingredients.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.unit})</option>)}</select></label>
          <label>Quantity<input aria-label={`Quantity ${index + 1}`} type="number" min="0.001" max="1000000" step="0.001" required value={line.quantity} onChange={(event) => changeLine(index, "quantity", event.target.value)} /></label>
          <label>Price / unit (INR)<input aria-label={`Unit price ${index + 1}`} type="number" min="0" max="1000000" step="0.01" required value={line.unitPrice} onChange={(event) => changeLine(index, "unitPrice", event.target.value)} /></label>
          <button type="button" className="outline-btn" aria-label={`Remove line ${index + 1}`} disabled={form.lines.length === 1} onClick={() => setForm((current) => ({ ...current, lines: current.lines.filter((_, idx) => idx !== index) }))}>Remove</button>
        </div>)}</div><button type="button" className="outline-btn" disabled={form.lines.length >= 50} onClick={() => setForm((current) => ({ ...current, lines: [...current.lines, newLine()] }))}>Add ingredient line</button>
        <label className="mt-4 block">Notes<textarea name="notes" maxLength={1000} value={form.notes} onChange={change} /></label><p className="mt-4 font-semibold">Estimated total: {formatPrice(estimatedPaise / 100)}</p><p className="mt-2 text-sm">Quantities use each ingredient's fixed stock unit. For 500 g of an ingredient tracked in kg, enter 0.5.</p>
      </> : null}
      {dialog.kind === "receive" ? <div className="space-y-4"><p>Enter only what arrived in this delivery. Leave other lines blank.</p>{dialog.order.lines.filter((line) => line.receivedQuantity < line.quantity).map((line) => <label className="block" key={line._id}>{line.name} — {Number((line.quantity - line.receivedQuantity).toFixed(3))} {line.unit} outstanding<input type="number" min="0" step="0.001" max={Number((line.quantity - line.receivedQuantity).toFixed(3))} value={receipt[line._id]} onChange={(event) => setReceipt((current) => ({ ...current, [line._id]: event.target.value }))} /></label>)}</div> : null}
      {dialog.kind === "view" ? <div className="space-y-4"><p><strong>{dialog.order.supplierName}</strong> · {statusLabel(dialog.order.status)}</p>{dialog.order.lines.map((line) => <p key={line._id}>{line.name} — {line.quantity} {line.unit} @ {formatPrice(line.unitPricePaise / 100)} = {formatPrice(line.lineTotalPaise / 100)}<br /><small>Received: {line.receivedQuantity} {line.unit}</small></p>)}<strong>Total: {formatPrice(dialog.order.totalPaise / 100)}</strong><p>{dialog.order.notes}</p><h3>Deliveries</h3>{dialog.order.receipts.length ? dialog.order.receipts.map((receipt) => <p key={receipt.key}>{new Date(receipt.receivedAt).toLocaleString()} — {receipt.lines.length} ingredient line(s)</p>) : <p>No deliveries recorded.</p>}</div> : null}
    </WorkspaceDialog> : null}
  </div>;
}
