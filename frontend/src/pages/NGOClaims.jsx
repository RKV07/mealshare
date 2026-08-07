import { useEffect, useState } from 'react';
import { getNGOClaims } from '../api.js';
import { Clock, CheckCircle2, XCircle, HeartHandshake, AlertCircle, Calendar } from 'lucide-react';

export default function NGOClaims() {
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState('all'); // all, Pending, Approved, Rejected
  const [loading, setLoading] = useState(true);

  async function loadClaims() {
    setLoading(true);
    try {
      const data = await getNGOClaims();
      setClaims(data);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClaims();
  }, []);

  const filteredClaims = claims.filter((c) => filter === 'all' || c.status === filter);

  return (
    <div className="space-y-6 fade-in-up font-[Outfit,sans-serif]">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-1">
          <HeartHandshake size={13} /> NGO Request Tracker
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Food Claims History & Status</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Track the approval status of your surplus food claim requests from Mess Admins.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1 w-fit border border-gray-200 dark:border-gray-700">
        {[
          { id: 'all', label: 'All Claims' },
          { id: 'Pending', label: 'Pending Approval' },
          { id: 'Approved', label: 'Approved' },
          { id: 'Rejected', label: 'Rejected' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === t.id
                ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400 animate-pulse">Loading claim records…</div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center text-xs text-gray-400 space-y-2">
          <p className="font-semibold text-gray-500">No {filter !== 'all' ? filter.toLowerCase() : ''} claims found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      claim.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : claim.status === 'Pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}
                  >
                    {claim.status === 'Approved' && <CheckCircle2 size={12} />}
                    {claim.status === 'Pending' && <Clock size={12} />}
                    {claim.status === 'Rejected' && <XCircle size={12} />}
                    {claim.status}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Calendar size={11} /> {new Date(claim.claimed_at).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{claim.surplus_description || 'Surplus Item'}</h4>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{claim.quantity_kg} kg Requested</p>

                {claim.notes && (
                  <p className="text-[11px] text-gray-500 italic mt-2 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    "{claim.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                {claim.status === 'Pending' && (
                  <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-semibold">
                    <Clock size={13} /> Awaiting Mess Admin approval
                  </p>
                )}
                {claim.status === 'Approved' && (
                  <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 size={13} /> Approved! Donation recorded
                  </p>
                )}
                {claim.status === 'Rejected' && (
                  <p className="text-red-500 flex items-center gap-1.5 font-semibold">
                    <XCircle size={13} /> Request declined by Mess Admin
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
