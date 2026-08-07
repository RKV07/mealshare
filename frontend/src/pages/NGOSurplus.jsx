import { useEffect, useState } from 'react';
import { PackageOpen, Clock, HeartHandshake, CheckCircle2, AlertCircle, Send, X } from 'lucide-react';
import { getSurplusBoard, submitNGOClaim } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const INP = 'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-all';

export default function NGOSurplus() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [surplusList, setSurplusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Claim Modal State
  const [selectedSurplus, setSelectedSurplus] = useState(null);
  const [claimForm, setClaimForm] = useState({ quantity_kg: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  function flash(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchSurplus() {
    setLoading(true);
    try {
      const res = await getSurplusBoard();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setSurplusList(list);
    } catch {
      flash('Failed to load surplus board', false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSurplus();
  }, []);

  function openClaimModal(item) {
    setSelectedSurplus(item);
    setClaimForm({ quantity_kg: item.quantity_kg, notes: '' });
  }

  async function handleClaimSubmit(e) {
    e.preventDefault();
    if (!selectedSurplus) return;

    setSubmitting(true);
    try {
      await submitNGOClaim({
        surplus_id: selectedSurplus.id,
        quantity_kg: parseFloat(claimForm.quantity_kg) || selectedSurplus.quantity_kg,
        notes: claimForm.notes,
      });

      flash('Claim request submitted! Awaiting Admin Approval.');
      setSelectedSurplus(null);
      fetchSurplus();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit claim request.';
      flash(msg, false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 fade-in-up font-[Outfit,sans-serif]">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${toast.ok ? 'bg-blue-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-1">
          <HeartHandshake size={13} /> NGO Food Redistribution
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Surplus Food Board</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Request surplus meals posted by mess admins. All claims are submitted for Admin Approval.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-xs animate-pulse">Loading surplus board…</div>
      ) : surplusList.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mx-auto">
            <PackageOpen size={24} />
          </div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white">No Surplus Food Available Right Now</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Mess admins post surplus food after meal services. Check back later or view your existing claim status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surplusList.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Available
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={12}/> {new Date(item.posted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{item.description}</h4>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400">{item.quantity_kg} kg</p>
                <p className="text-xs text-gray-400 mt-1">Fresh surplus ready for distribution</p>
              </div>

              <button
                onClick={() => openClaimModal(item)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm mt-3"
              >
                <HeartHandshake size={15}/> Request Claim (Admin Approval)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Claim Request Modal */}
      {selectedSurplus && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Request Surplus Claim</h3>
                <p className="text-xs text-gray-400">Claim requires approval from Mess Admin</p>
              </div>
              <button onClick={() => setSelectedSurplus(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-bold">{selectedSurplus.description}</p>
              <p>Total Surplus Available: {selectedSurplus.quantity_kg} kg</p>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Quantity Required (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  max={selectedSurplus.quantity_kg}
                  min="0.5"
                  value={claimForm.quantity_kg}
                  onChange={(e) => setClaimForm({ ...claimForm, quantity_kg: e.target.value })}
                  required
                  className={INP}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Pickup Notes / Estimated Arrival Time</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Pickup van will arrive at 4:30 PM. Contact person: Ramesh."
                  value={claimForm.notes}
                  onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
                  className={INP}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting…' : 'Submit for Admin Approval'} <Send size={14}/>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSurplus(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
