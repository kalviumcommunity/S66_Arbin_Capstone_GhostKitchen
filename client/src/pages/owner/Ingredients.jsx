import { useState } from "react";
import { Link } from "react-router-dom";
import { procurement } from "../../api/procurement";
import { useProcurementData } from "../../hooks/useProcurementData";
import WorkspaceDialog from "../../components/owner/WorkspaceDialog";

const empty = { name: "", category: "Pantry", unit: "kg", stockQuantity: "0", lowStockThreshold: "1", supplierId: "" };

export default function Ingredients() {
  const { ingredients, suppliers, history, summary, error, setError, loading, reload, days, setDays } = useProcurementData();
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [adjustment, setAdjustment] = useState({ type: "usage", quantity: "", note: "" });
  const low = ingredients.filter((item) => item.lowStock);
  const filtered = ingredients.filter((item) => (!lowOnly || item.lowStock) && `${item.name} ${item.category} ${item.supplierId?.name || ""}`.toLowerCase().includes(search.toLowerCase()));
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const open = (kind, item) => {
    setDialogError("");
    setDialog({ kind, item, key: crypto.randomUUID() });
    setForm(item ? { ...item, supplierId: item.supplierId?._id || "" } : empty);
    setAdjustment({ type: "usage", quantity: "", note: "" });
  };
  const save = async (event) => {
    event.preventDefault();
    setBusy(true); setDialogError("");
    try {
      if (dialog.kind === "adjust") await procurement.adjust(dialog.item._id, { ...adjustment, quantity: Number(adjustment.quantity) }, dialog.key);
      else {
        const payload = { name: form.name, category: form.category, unit: form.unit, lowStockThreshold: Number(form.lowStockThreshold), supplierId: form.supplierId };
        if (!dialog.item) payload.stockQuantity = Number(form.stockQuantity);
        await procurement.save("ingredients", payload, dialog.item?._id);
      }
      setDialog(null); await reload();
    } catch (error) { setDialogError(error.response?.data?.message || "Unable to save ingredient changes."); }
    finally { setBusy(false); }
  };
  const archive = async (item) => {
    setBusy(true);
    try { await procurement.archive("ingredients", item._id); await reload(); }
    catch (error) { setError(error.response?.data?.message || "Unable to archive ingredient."); }
    finally { setBusy(false); }
  };
  return <div className="inventory-page">
    <div className="inventory-heading"><div><h1>Ingredients</h1><p>Plan daily or weekly purchases, record usage and waste, and track what remains.</p></div><div className="flex flex-wrap gap-2"><Link to="/owner/purchase-orders" className="outline-btn">Purchase orders & suppliers</Link><button className="primary-btn" type="button" onClick={() => open("edit")}>Add ingredient</button></div></div>
    {loading ? <p role="status">Loading ingredients…</p> : null}
    {error ? <p role="alert" className="my-3 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}
    {low.length ? <div role="status" className="my-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900"><strong>{low.length} ingredient{low.length === 1 ? " is" : "s are"} low or out of stock.</strong><p>{low.map((item) => `${item.name}: ${item.stockQuantity} ${item.unit}`).join(" · ")}</p></div> : null}
    <section className="purchase-table-card">
      <div className="purchase-table-head"><div><h2>Ingredient stock</h2><p>Usage is entered by staff; food sales do not automatically consume ingredients.</p></div><button type="button" className="outline-btn" onClick={reload}>Refresh</button></div>
      <div className="purchase-toolbar"><input aria-label="Search ingredients" placeholder="Search name, category or supplier" value={search} onChange={(event) => setSearch(event.target.value)} /><label><input type="checkbox" checked={lowOnly} onChange={(event) => setLowOnly(event.target.checked)} /> Low stock only</label></div>
      <div className="purchase-table-wrap"><table className="purchase-table"><thead><tr><th>Ingredient</th><th>Supplier</th><th>Remaining</th><th>Low-stock threshold</th><th>Used / wasted ({days} days)</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => {
        const used = summary.find((entry) => entry.ingredientId === item._id)?.total || 0;
        return <tr key={item._id}><td><b>{item.name}</b><small>{item.category}</small></td><td>{item.supplierId?.name || "—"}</td><td>{item.stockQuantity} {item.unit}</td><td>{item.lowStockThreshold} {item.unit}</td><td>{Number(used.toFixed(3))} {item.unit}</td><td>{item.stockQuantity === 0 ? "Out of stock" : item.lowStock ? "Low stock" : "Available"}</td><td><div className="flex flex-wrap gap-2"><button className="row-action" type="button" disabled={busy} onClick={() => open("adjust", item)}>Record usage / adjustment</button><button className="row-action" type="button" onClick={() => open("edit", item)}>Edit</button><button className="row-action" type="button" disabled={busy} onClick={() => archive(item)}>Archive</button></div></td></tr>;
      })}</tbody></table></div>{!loading && !filtered.length ? <div className="purchase-empty">No ingredients found. Add an ingredient to start planning purchases.</div> : null}
    </section>
    <section className="purchase-table-card mt-6"><div className="purchase-table-head"><div><h2>Stock history</h2><p>Purchase deliveries, usage, waste, and corrections.</p></div><select aria-label="History period" value={days} onChange={(event) => setDays(event.target.value)}><option value="1">Today / last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="365">Last year</option></select></div><div className="purchase-table-wrap"><table className="purchase-table"><thead><tr><th>When</th><th>Ingredient</th><th>Reason</th><th>Change</th><th>Remaining</th><th>Staff / note</th></tr></thead><tbody>{history.map((entry) => <tr key={entry._id}><td>{new Date(entry.createdAt).toLocaleString()}</td><td>{entry.ingredientName}</td><td>{entry.type.replaceAll("_", " ")}</td><td>{entry.quantityChange > 0 ? "+" : ""}{entry.quantityChange} {entry.unit}</td><td>{entry.newStock} {entry.unit}</td><td>{entry.updatedBy?.username || "Staff"}<small>{entry.note || "Purchase delivery received"}</small></td></tr>)}</tbody></table></div>{!history.length ? <div className="purchase-empty">No stock changes in this period.</div> : null}</section>
    {dialog ? <WorkspaceDialog title={dialog.kind === "adjust" ? `Record stock change: ${dialog.item.name}` : dialog.item ? "Edit ingredient" : "Add ingredient"} onClose={() => setDialog(null)} onSubmit={save} busy={busy} error={dialogError}>
      {dialog.kind === "adjust" ? <div className="purchase-form-grid">
        <label>Reason<select value={adjustment.type} onChange={(event) => setAdjustment((current) => ({ ...current, type: event.target.value }))}><option value="usage">Used in kitchen</option><option value="waste">Waste / spoilage</option><option value="adjustment">Correction (+ or −)</option></select></label>
        <label>Quantity ({dialog.item.unit})<input type="number" min={adjustment.type === "adjustment" ? undefined : "0.001"} step="0.001" required value={adjustment.quantity} onChange={(event) => setAdjustment((current) => ({ ...current, quantity: event.target.value }))} /></label>
        <label className="purchase-notes">Note<textarea required maxLength={1000} value={adjustment.note} onChange={(event) => setAdjustment((current) => ({ ...current, note: event.target.value }))} placeholder="e.g. Chicken used for Monday service" /></label>
      </div> : <div className="purchase-form-grid">
        <label>Name<input name="name" maxLength={120} required value={form.name} onChange={change} /></label><label>Category<input name="category" maxLength={80} required value={form.category} onChange={change} /></label>
        <label>Stock unit (fixed)<select name="unit" disabled={Boolean(dialog.item)} value={form.unit} onChange={change}>{["kg", "g", "l", "ml", "unit"].map((unit) => <option key={unit}>{unit}</option>)}</select></label>
        {!dialog.item ? <label>Opening stock<input name="stockQuantity" type="number" min="0" step="0.001" required value={form.stockQuantity} onChange={change} /></label> : null}
        <label>Low-stock threshold<input name="lowStockThreshold" type="number" min="0" step="0.001" required value={form.lowStockThreshold} onChange={change} /></label>
        <label>Preferred supplier<select name="supplierId" value={form.supplierId} onChange={change}><option value="">None</option>{suppliers.filter((supplier) => supplier.active).map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}</select></label>
      </div>}
    </WorkspaceDialog> : null}
  </div>;
}
