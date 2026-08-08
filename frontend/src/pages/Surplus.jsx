import { useEffect, useState } from 'react';
import { PackageOpen, Clock, CheckCircle } from 'lucide-react';
import { getSurplusBoard, claimSurplus } from '../api.js';
import client from '../api.js';

const INP = 'w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 transition-colors';

export default function Surplus() {
  const [items,   setItems]   = useState([]);
  const [ngoItems, setNgoItems] = useState([]);
  const [tab,     setTab]     = useState('available');
  const [toast,   setToast]   = useState(null);
  const [loading, setLoading] = useState(true);

  function flash(msg, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); }

  async function load() {
    setLoading(true);
    try {
      const [s, ngo] = await Promise.all([
        getSurplusBoard(),
        client.get('/surplus/unclaimed/').then(r => r.data).catch(() => []),
      ]);
      setItems(Array.isArray(s) ? s : (s?.data || []));
      setNgoItems(Array.isArray(ngo) ? ngo : (ngo?.data || []));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleClaim(id) {
    try {
      const res = await claimSurplus(id, {});
      flash(res?.message || 'Food claim request submitted! Pending admin approval. ⏳');
      load();
    } catch (err) { flash(err.response?.data?.error || 'Could not claim — may already be taken or pending.', false); }
  }

  const available = items.filter(i => i.is_available);
  const claimed   = items.filter(i => !i.is_available);

  return (
    <div className="space-y-5 fade-in-up">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Redistribution</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Surplus Food Board</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Claim leftover food before it goes to waste</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available Now',     value: available.length,                                          color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Total Surplus kg',  value: available.reduce((s, i) => s + i.quantity_kg, 0).toFixed(1) + ' kg', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'NGO Pickup Ready',  value: ngoItems.length,                                           color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[['available', '🟢 Available'], ['claimed', '✓ Claimed'], ['ngo', '🤝 NGO Pickup']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === key ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* Available tab */}
          {tab === 'available' && (
            available.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-center py-16">
                <PackageOpen size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3"/>
                <p className="font-semibold text-gray-500 dark:text-gray-400">No surplus available right now</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back after meals are logged by the admin</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {available.map(item => (
                  <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-green-100 dark:border-green-900/30 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"/>
                      <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">LIVE</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">{item.description}</p>
                    <p className="text-2xl font-black text-green-600 dark:text-green-400 mb-1">{item.quantity_kg} <span className="text-sm font-medium">kg</span></p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                      <Clock size={11}/> Posted {new Date(item.posted_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </div>
                    <button onClick={() => handleClaim(item.id)}
                      className="w-full py-2 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
                      Claim This Food
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Claimed tab */}
          {tab === 'claimed' && (
            claimed.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Nothing claimed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {claimed.map(item => (
                  <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 opacity-70">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={14} className="text-green-500"/>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">CLAIMED</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.quantity_kg} kg</p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* NGO tab */}
          {tab === 'ngo' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                🤝 These items have been available for <strong>2+ hours</strong> and are ready for NGO pickup. Contact your registered NGOs to coordinate collection.
              </div>
              {ngoItems.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No items pending NGO pickup right now.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ngoItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-5">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">NGO PICKUP</span>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-1 text-sm">{item.description}</p>
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">{item.quantity_kg} <span className="text-sm font-medium">kg</span></p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                        <Clock size={11}/> Posted {new Date(item.posted_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
