import { useEffect, useState } from 'react';
import { Users, Utensils, CheckCircle2, PackageOpen, HandHeart, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import StatCard from '../components/StatCard.jsx';
import { getAdminDashboardStats } from '../api.js';

const C = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-xl text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value} {p.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadStats() {
    setLoading(true);
    try {
      const res = await getAdminDashboardStats();
      setData(res);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load Admin Dashboard stats.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-medium text-gray-400 animate-pulse">Loading Admin Dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  const { cards, charts, tables } = data || {};

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-green-600 p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"/>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={12}/> System Admin Control
              </span>
              <span className="text-xs text-purple-100">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <h1 className="text-2xl font-bold">Admin Management Center</h1>
            <p className="text-xs text-purple-100 mt-1">Real-time overview of students, meal bookings, NGO requests, and surplus redistribution.</p>
          </div>
          <button onClick={loadStats} className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-md border border-white/20 transition-all">
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Students" value={cards?.total_students || 0} unit="registered" icon={Users} color="purple"/>
        <StatCard label="Today's Bookings" value={cards?.todays_bookings || 0} unit="booked for today" icon={Utensils} color="blue"/>
        <StatCard label="Meals Served" value={cards?.meals_served || 0} unit="attended today" icon={CheckCircle2} color="green"/>
        <StatCard label="Remaining Surplus" value={`${cards?.remaining_meals_kg || 0} kg`} unit="available now" icon={PackageOpen} color="yellow"/>
        <StatCard label="Pending NGO Claims" value={cards?.pending_ngo_claims || 0} unit="awaiting review" icon={AlertCircle} color="red"/>
        <StatCard label="Total Donations" value={`${cards?.total_donations_kg || 0} kg`} unit="shared with NGOs" icon={HandHeart} color="purple"/>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Bookings Chart */}
        <div className={C}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Trend</p>
              <h3 className="font-bold text-gray-900 dark:text-white">Daily Bookings (Last 7 Days)</h3>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
              Bookings Activity
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts?.daily_bookings || []} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="bookings" name="Bookings" fill="#6366f1" radius={[6, 6, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Meal Usage Chart */}
        <div className={C}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Inventory & Consumption</p>
              <h3 className="font-bold text-gray-900 dark:text-white">Weekly Meal Usage (Prepared vs Consumed)</h3>
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
              Food Audit
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts?.weekly_usage || []} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="kg"/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize: 12 }}/>
              <Bar dataKey="Prepared" fill="#fbbf24" radius={[6, 6, 0, 0]}/>
              <Bar dataKey="Consumed" fill="#22c55e" radius={[6, 6, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className={C}>
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex items-center justify-between">
            <span>Recent Bookings</span>
            <span className="text-xs font-normal text-gray-400">Latest 10</span>
          </h3>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {tables?.recent_bookings?.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No bookings recorded yet.</p>
            ) : (
              tables?.recent_bookings?.map(b => (
                <div key={b.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{b.student_name || 'Student'}</p>
                    <p className="text-[11px] text-gray-400">{b.meal_type} · {b.date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.attended ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {b.attended ? 'Attended' : 'Booked'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Claims */}
        <div className={C}>
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex items-center justify-between">
            <span>Recent Claims</span>
            <span className="text-xs font-normal text-gray-400">Student & NGO</span>
          </h3>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {tables?.recent_claims?.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No claims made yet.</p>
            ) : (
              tables?.recent_claims?.map(c => (
                <div key={c.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{c.ngo_name || c.student_name || 'Claimant'}</p>
                    <p className="text-[11px] text-gray-400">{c.quantity_kg} kg · {c.claim_type}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40' :
                    c.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40' :
                    'bg-red-100 text-red-700 dark:bg-red-900/40'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className={C}>
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex items-center justify-between">
            <span>Recent Students</span>
            <span className="text-xs font-normal text-gray-400">Total: {cards?.total_students || 0}</span>
          </h3>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {tables?.recent_students?.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No students registered yet.</p>
            ) : (
              tables?.recent_students?.map(s => (
                <div key={s.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{s.name}</p>
                    <p className="text-[11px] text-gray-400">Room {s.room_no}</p>
                  </div>
                  {s.dietary_pref && (
                    <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium shrink-0">
                      {s.dietary_pref}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
