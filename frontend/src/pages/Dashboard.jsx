import { useEffect, useMemo, useState } from 'react';
import { Utensils, PackageOpen, BarChart3, Sparkles, TrendingDown, Clock, Lock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import StatCard from '../components/StatCard.jsx';
import { getMealLogs, createMealLog, getSurplusBoard, getWasteReport, getPrediction, claimSurplus } from '../api.js';
import { useStudent } from '../StudentContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const C = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5';
const INP = 'w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 transition-colors';

const TT = ({ active, payload, label }) => active && payload?.length ? (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs">
    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
    {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value} kg</p>)}
  </div>
) : null;

export default function Dashboard() {
  const { currentStudent } = useStudent();
  const { account } = useAuth();
  const isAdmin = !!account?.is_admin;

  const [meals,    setMeals]    = useState([]);
  const [surplus,  setSurplus]  = useState([]);
  const [waste,    setWaste]    = useState(null);
  const [mealType, setMealType] = useState('Lunch');
  const [pred,     setPred]     = useState(null);
  const [form,     setForm]     = useState({ meal_name: '', meal_type: 'Lunch', prepared_kg: '', consumed_kg: '' });
  const [busy,     setBusy]     = useState(false);
  const [toast,    setToast]    = useState(null);
  const [err,      setErr]      = useState('');

  function flash(msg, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); }

  async function load() {
    try {
      const [m, s, w] = await Promise.all([getMealLogs(), getSurplusBoard(), getWasteReport()]);
      setMeals(Array.isArray(m) ? m : (m?.data || []));
      setSurplus(Array.isArray(s) ? s : (s?.data || []));
      setWaste(w);
      setErr('');
    } catch { setErr('Cannot reach API. Make sure Django is running on port 8000.'); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    getPrediction(mealType).then(setPred).catch(() => setPred(null));
  }, [mealType]);

  async function handleSubmit(e) {
    e.preventDefault(); setBusy(true);
    try {
      await createMealLog(form);
      const diff = Number(form.prepared_kg) - Number(form.consumed_kg);
      flash(diff > 0 ? `Logged ✓ — ${diff.toFixed(1)} kg surplus auto-posted!` : 'Meal logged successfully!');
      setForm({ meal_name: '', meal_type: 'Lunch', prepared_kg: '', consumed_kg: '' });
      load();
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to log meal.', false);
    } finally { setBusy(false); }
  }

  async function handleClaim(item) {
    try {
      await claimSurplus(item.id, {});
      flash('Food claimed! 🎉'); load();
    } catch { flash('Could not claim — already taken.', false); }
  }

  const chartData = useMemo(() => {
    const by = {};
    for (const m of meals) {
      if (!by[m.date]) by[m.date] = { day: m.date.slice(5), Prepared: 0, Consumed: 0 };
      by[m.date].Prepared += m.prepared_kg; by[m.date].Consumed += m.consumed_kg;
    }
    return Object.values(by).sort((a, b) => a.day.localeCompare(b.day)).slice(-7);
  }, [meals]);

  const wasteTrend = useMemo(() => {
    const by = {};
    for (const m of meals) {
      if (!by[m.date]) by[m.date] = { p: 0, c: 0 };
      by[m.date].p += m.prepared_kg; by[m.date].c += m.consumed_kg;
    }
    return Object.entries(by).map(([day, v]) => ({
      day: day.slice(5),
      waste: v.p ? +(((v.p - v.c) / v.p) * 100).toFixed(1) : 0
    })).sort((a, b) => a.day.localeCompare(b.day)).slice(-7);
  }, [meals]);

  const surplusKg = surplus.filter(s => s.is_available).reduce((s, i) => s + i.quantity_kg, 0);
  const todayStr  = new Date().toISOString().slice(0, 10);
  const todayMeals = meals.filter(m => m.date === todayStr);

  return (
    <div className="space-y-5 fade-in-up">
      {err && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-800">{err}</div>}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-green-700 to-green-500 p-6 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10"/>
        <div className="absolute right-20 -bottom-6 w-24 h-24 rounded-full bg-white/10"/>
        <div className="relative z-10">
          <p className="text-green-100 text-sm mb-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold mb-1">
            {currentStudent ? `Hello, ${currentStudent.name.split(' ')[0]} 👋` : 'MealShare Dashboard'}
          </h1>
          <p className="text-green-100 text-sm">
            {isAdmin ? `${todayMeals.length} meals logged today · ` : ''}{surplusKg.toFixed(1)} kg surplus available
          </p>
          {isAdmin && <span className="inline-block mt-2 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">🛡️ Admin View</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {isAdmin && <StatCard label="Meals Today" value={todayMeals.length} unit="entries logged" icon={Utensils} color="green"/>}
        <StatCard label="Surplus Available" value={`${surplusKg.toFixed(1)} kg`} unit="ready to claim" icon={PackageOpen} color="yellow"/>
        {isAdmin && <StatCard label="Overall Waste" value={waste ? `${waste.waste_percentage}%` : '—'} unit="of total prepared" icon={TrendingDown} color={waste?.waste_percentage > 20 ? 'red' : 'blue'}/>}
        <StatCard label="Tomorrow's Need" value={pred ? `${pred.predicted_kg} kg` : '—'} unit={`for ${mealType}`} icon={Sparkles} color="purple"/>
      </div>

      {/* Prediction + Meal Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Prediction — visible to all */}
        <div className={`${C} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">ML Prediction</p>
              <h3 className="font-semibold text-gray-900 dark:text-white">Tomorrow's Demand</h3>
            </div>
            <Sparkles size={16} className="text-yellow-500"/>
          </div>
          <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {['Breakfast', 'Lunch', 'Dinner'].map(t => (
              <button key={t} onClick={() => setMealType(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mealType === t ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                {t}
              </button>
            ))}
          </div>
          {pred ? (
            <div className="text-center py-4">
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 ${
                pred.predicted_kg > 60 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : pred.predicted_kg > 40 ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"/>
                {pred.predicted_kg > 60 ? 'High demand' : pred.predicted_kg > 40 ? 'Moderate' : 'Low demand'}
              </div>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{pred.predicted_kg}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">kg recommended for {mealType}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Calculating…</div>
          )}
        </div>

        {/* Meal Logger — admin only */}
        <div className={`${C} lg:col-span-3`}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Mess Manager</p>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Log Today's Meal</h3>
          {isAdmin ? (
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              {[['Meal Name', 'meal_name', 'text', 'e.g. Dal Rice'],
                ['Prepared (kg)', 'prepared_kg', 'number', '50'],
                ['Consumed (kg)', 'consumed_kg', 'number', '45']].map(([label, key, type, ph]) => (
                <div key={key} className={key === 'meal_name' ? 'col-span-2' : ''}>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
                  <input type={type} placeholder={ph} required value={form[key]} step={type === 'number' ? '0.1' : undefined}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={INP}/>
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Meal Type</label>
                <select value={form.meal_type} onChange={e => setForm(f => ({ ...f, meal_type: e.target.value }))} className={INP}>
                  <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
                </select>
              </div>
              <button type="submit" disabled={busy}
                className="col-span-2 mt-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors">
                {busy ? 'Submitting…' : '+ Log Meal'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400 dark:text-gray-500">
              <Lock size={28} className="opacity-40"/>
              <p className="text-sm font-medium">Meal logging is for admins only.</p>
              <p className="text-xs text-center">You can book meals from the <span className="text-green-600 font-semibold">Meal Bookings</span> page.</p>
            </div>
          )}
        </div>
      </div>

      {/* Surplus board */}
      <div className={C}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Redistribution</p>
            <h3 className="font-semibold text-gray-900 dark:text-white">Surplus Board</h3>
          </div>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
            {surplus.filter(s => s.is_available).length} available
          </span>
        </div>
        {surplus.length === 0 ? (
          <div className="text-center py-10">
            <PackageOpen size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-2"/>
            <p className="text-sm text-gray-400">No surplus yet — admin logs a meal with leftovers to post here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {surplus.slice(0, 6).map(item => (
              <div key={item.id} className={`rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                item.is_available ? 'border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-100 dark:border-gray-800 opacity-50'}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">{item.description}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${item.is_available ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                    {item.is_available ? 'Live' : 'Claimed'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.quantity_kg} kg</p>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-3">
                  <Clock size={11}/>{new Date(item.posted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <button disabled={!item.is_available} onClick={() => handleClaim(item)}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${item.is_available ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {item.is_available ? 'Claim Food' : 'Claimed'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts — admin only */}
      {isAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className={C}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Prepared vs Consumed (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Legend wrapperStyle={{ fontSize: 12 }}/>
                <Bar dataKey="Prepared" fill="#fbbf24" radius={[6, 6, 0, 0]}/>
                <Bar dataKey="Consumed" fill="#22c55e" radius={[6, 6, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={C}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Waste % Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={wasteTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%"/>
                <Tooltip/>
                <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
