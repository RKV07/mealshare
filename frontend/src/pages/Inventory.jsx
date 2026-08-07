import { useEffect, useState } from "react";
import client from "../api.js";

const card = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6";
const input = "w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none border border-gray-200 dark:border-gray-700 focus:border-primary bg-gray-50 dark:bg-gray-800 text-ink dark:text-gray-100";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [low, setLow] = useState([]);
  const [form, setForm] = useState({ name: "", stock_kg: "", unit: "kg", low_stock_alert: "5" });
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const [inv, alerts] = await Promise.all([
        client.get("/ingredients/").then(r => r.data),
        client.get("/ingredients/low-stock/").then(r => r.data),
      ]);
      setItems(inv); setLow(alerts);
    } catch { setMsg("Could not load inventory."); }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await client.post("/ingredients/", form);
      setMsg("Ingredient added!");
      setForm({ name: "", stock_kg: "", unit: "kg", low_stock_alert: "5" });
      load();
    } catch { setMsg("Failed to add ingredient."); }
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-ink dark:text-gray-100">Ingredient Inventory</h2>
          <p className="text-sm text-inkSoft dark:text-gray-400">Track stock levels and get low-stock alerts</p>
        </div>
      </div>

      {/* Low stock alerts */}
      {low.length > 0 && (
        <div className="rounded-xl bg-warning/10 border border-warning/20 p-4 mb-2">
          <p className="text-sm font-semibold text-warning mb-2">⚠ Low Stock Alerts ({low.length})</p>
          <div className="flex flex-wrap gap-2">
            {low.map(i => (
              <span key={i.id} className="text-xs bg-warning/10 text-warning border border-warning/20 px-3 py-1 rounded-full font-medium">
                {i.name}: {i.stock_kg}{i.unit} remaining
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Add form */}
        <div className={card}>
          <h3 className="font-semibold text-ink dark:text-gray-100 mb-4">Add Ingredient</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            {[["Name", "name", "text", "e.g. Dal"], ["Stock (kg)", "stock_kg", "number", "20"], ["Low stock alert (kg)", "low_stock_alert", "number", "5"]].map(([label, key, type, ph]) => (
              <div key={key}>
                <label className="text-xs font-medium text-inkSoft dark:text-gray-400">{label}</label>
                <input type={type} placeholder={ph} required value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={input} />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-inkSoft dark:text-gray-400">Unit</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={input}>
                <option>kg</option><option>litres</option><option>units</option>
              </select>
            </div>
            {msg && <p className="text-xs text-success">{msg}</p>}
            <button type="submit" className="py-2.5 rounded-xl text-sm font-semibold text-white bg-primary">Add Ingredient</button>
          </form>
        </div>

        {/* Inventory table */}
        <div className={`${card} lg:col-span-2`}>
          <h3 className="font-semibold text-ink dark:text-gray-100 mb-4">Current Stock ({items.length} items)</h3>
          {items.length === 0 ? (
            <p className="text-sm text-inkSoft dark:text-gray-400">No ingredients added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Ingredient", "Stock", "Unit", "Alert at", "Status"].map(h => (
                      <th key={h} className="text-left pb-3 text-xs font-semibold text-inkSoft dark:text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => {
                    const isLow = i.stock_kg <= i.low_stock_alert;
                    return (
                      <tr key={i.id} className="border-b border-gray-50 dark:border-gray-800/50">
                        <td className="py-3 font-medium text-ink dark:text-gray-100">{i.name}</td>
                        <td className="py-3 text-ink dark:text-gray-200">{i.stock_kg}</td>
                        <td className="py-3 text-inkSoft dark:text-gray-400">{i.unit}</td>
                        <td className="py-3 text-inkSoft dark:text-gray-400">{i.low_stock_alert} {i.unit}</td>
                        <td className="py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isLow ? "text-danger bg-danger/10" : "text-success bg-success/10"}`}>
                            {isLow ? "Low" : "OK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
