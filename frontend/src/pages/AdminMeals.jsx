import { useEffect, useState } from 'react';
import { Utensils, PlusCircle, Edit3, Trash2, Calendar, Check, Clock } from 'lucide-react';
import { getMealLogs, createMealLog, updateMealLog, deleteMealLog } from '../api.js';

const INP = 'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 transition-all';

export default function AdminMeals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ meal_name: '', meal_type: 'Lunch', prepared_kg: '', consumed_kg: '' });
  const [editMeal, setEditMeal] = useState(null);
  const [editForm, setEditForm] = useState({ meal_name: '', meal_type: 'Lunch', prepared_kg: '', consumed_kg: '' });

  function flash(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await getMealLogs();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setMeals(list);
    } catch {
      flash('Failed to load meal logs.', false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (parseFloat(form.consumed_kg) > parseFloat(form.prepared_kg)) {
      flash('Consumed quantity cannot exceed prepared quantity.', false);
      return;
    }
    try {
      await createMealLog(form);
      flash('Meal logged & surplus auto-posted!');
      setForm({ meal_name: '', meal_type: 'Lunch', prepared_kg: '', consumed_kg: '' });
      load();
    } catch {
      flash('Failed to log meal.', false);
    }
  }

  function startEdit(m) {
    setEditMeal(m);
    setEditForm({
      meal_name: m.meal_name,
      meal_type: m.meal_type,
      prepared_kg: m.prepared_kg,
      consumed_kg: m.consumed_kg,
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editMeal) return;
    if (parseFloat(editForm.consumed_kg) > parseFloat(editForm.prepared_kg)) {
      flash('Consumed quantity cannot exceed prepared quantity.', false);
      return;
    }
    try {
      await updateMealLog(editMeal.id, editForm);
      flash('Meal log updated!');
      setEditMeal(null);
      load();
    } catch {
      flash('Failed to update meal log.', false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete meal record for ${name}?`)) return;
    try {
      await deleteMealLog(id);
      flash('Meal record deleted.');
      load();
    } catch {
      flash('Could not delete meal log.', false);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysMenu = meals.filter(m => m.date === todayStr);

  return (
    <div className="space-y-6 fade-in-up">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-widest">Admin Control</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meal & Daily Menu Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Log meals, update prepared/consumed quantities, and manage the daily mess menu</p>
      </div>

      {/* Daily Menu Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
            <Utensils size={18} className="text-green-600"/> Today's Mess Menu ({todayStr})
          </h3>
          <span className="text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-3 py-1 rounded-full">
            {todaysMenu.length} Meals Prepared Today
          </span>
        </div>
        {todaysMenu.length === 0 ? (
          <p className="text-xs text-gray-500">No meals logged for today yet. Use the form below to log today's menu.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {['Breakfast', 'Lunch', 'Dinner'].map(t => {
              const item = todaysMenu.find(m => m.meal_type === t);
              return (
                <div key={t} className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-green-100 dark:border-green-900/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 block mb-0.5">{t}</span>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{item ? item.meal_name : 'Not logged'}</p>
                  {item && (
                    <p className="text-xs text-gray-400 mt-1">
                      Prep: {item.prepared_kg}kg · Cons: {item.consumed_kg}kg ({item.surplus_kg > 0 ? `+${item.surplus_kg}kg surplus` : '0 surplus'})
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel: Log or Edit */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle size={18} className="text-green-600"/>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {editMeal ? `Edit Meal: ${editMeal.meal_name}` : 'Log New Meal'}
            </h3>
          </div>

          {editMeal ? (
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Meal Name</label>
                <input required value={editForm.meal_name} onChange={e => setEditForm(f => ({ ...f, meal_name: e.target.value }))} className={INP}/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Meal Type</label>
                <select value={editForm.meal_type} onChange={e => setEditForm(f => ({ ...f, meal_type: e.target.value }))} className={INP}>
                  <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Prepared (kg)</label>
                  <input type="number" step="0.1" required value={editForm.prepared_kg} onChange={e => setEditForm(f => ({ ...f, prepared_kg: e.target.value }))} className={INP}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Consumed (kg)</label>
                  <input type="number" step="0.1" required value={editForm.consumed_kg} onChange={e => setEditForm(f => ({ ...f, consumed_kg: e.target.value }))} className={INP}/>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                  <Check size={14}/> Save Changes
                </button>
                <button type="button" onClick={() => setEditMeal(null)} className="px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Meal Name</label>
                <input placeholder="e.g. Rajma Chawal" required value={form.meal_name} onChange={e => setForm(f => ({ ...f, meal_name: e.target.value }))} className={INP}/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Meal Type</label>
                <select value={form.meal_type} onChange={e => setForm(f => ({ ...f, meal_type: e.target.value }))} className={INP}>
                  <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Prepared (kg)</label>
                  <input type="number" step="0.1" placeholder="50" required value={form.prepared_kg} onChange={e => setForm(f => ({ ...f, prepared_kg: e.target.value }))} className={INP}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Consumed (kg)</label>
                  <input type="number" step="0.1" placeholder="42" required value={form.consumed_kg} onChange={e => setForm(f => ({ ...f, consumed_kg: e.target.value }))} className={INP}/>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors mt-1">
                + Log Meal
              </button>
            </form>
          )}
        </div>

        {/* Meal Logs History Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 lg:col-span-2">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Meal Logs History ({meals.length})</h3>
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm animate-pulse">Loading meals…</div>
          ) : meals.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No meal logs recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase">
                    <th className="pb-3 text-left font-semibold">Date</th>
                    <th className="pb-3 text-left font-semibold">Meal</th>
                    <th className="pb-3 text-left font-semibold">Type</th>
                    <th className="pb-3 text-left font-semibold">Prep (kg)</th>
                    <th className="pb-3 text-left font-semibold">Cons (kg)</th>
                    <th className="pb-3 text-left font-semibold">Surplus</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {meals.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 text-gray-500">{m.date}</td>
                      <td className="py-3 font-semibold text-gray-800 dark:text-gray-200">{m.meal_name}</td>
                      <td className="py-3"><span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-[10px] font-medium">{m.meal_type}</span></td>
                      <td className="py-3">{m.prepared_kg}</td>
                      <td className="py-3">{m.consumed_kg}</td>
                      <td className="py-3">
                        <span className={`font-semibold ${m.surplus_kg > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {m.surplus_kg > 0 ? `+${m.surplus_kg}kg` : '0kg'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(m)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                            <Edit3 size={14}/>
                          </button>
                          <button onClick={() => handleDelete(m.id, m.meal_name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
