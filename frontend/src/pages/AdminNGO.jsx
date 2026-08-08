import { useEffect, useState } from 'react';
import { HandHeart, Plus, CheckCircle2, XCircle, Edit3, Trash2, Clock, Phone, Mail, MapPin } from 'lucide-react';
import { getNGOContacts, addNGOContact, updateNGOContact, deleteNGOContact, getNGOClaims, approveNGOClaim, rejectNGOClaim } from '../api.js';

const INP = 'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 transition-all';

export default function AdminNGO() {
  const [ngos, setNgos] = useState([]);
  const [claims, setClaims] = useState([]);
  const [tab, setTab] = useState('claims'); // claims or contacts
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '' });
  const [editNgo, setEditNgo] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', city: '' });

  function flash(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [ngoRes, claimRes] = await Promise.all([getNGOContacts(), getNGOClaims()]);
      setNgos(ngoRes);
      setClaims(claimRes);
    } catch {
      flash('Failed to load NGO data.', false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleAddNGO(e) {
    e.preventDefault();
    try {
      await addNGOContact(form);
      flash('NGO Contact registered!');
      setForm({ name: '', email: '', phone: '', city: '' });
      loadData();
    } catch {
      flash('Failed to register NGO.', false);
    }
  }

  function startEdit(ngo) {
    setEditNgo(ngo);
    setEditForm({ name: ngo.name, email: ngo.email, phone: ngo.phone, city: ngo.city });
  }

  async function handleUpdateNGO(e) {
    e.preventDefault();
    if (!editNgo) return;
    try {
      await updateNGOContact(editNgo.id, editForm);
      flash('NGO Contact updated!');
      setEditNgo(null);
      loadData();
    } catch {
      flash('Failed to update NGO contact.', false);
    }
  }

  async function handleDeleteNGO(id, name) {
    if (!window.confirm(`Delete NGO contact ${name}?`)) return;
    try {
      await deleteNGOContact(id);
      flash('NGO contact deleted.');
      loadData();
    } catch {
      flash('Could not delete NGO contact.', false);
    }
  }

  async function handleApprove(claimId) {
    try {
      await approveNGOClaim(claimId);
      flash('NGO Claim approved & food donation recorded!');
      loadData();
    } catch {
      flash('Could not approve claim.', false);
    }
  }

  async function handleReject(claimId) {
    try {
      await rejectNGOClaim(claimId);
      flash('NGO Claim rejected.');
      loadData();
    } catch {
      flash('Could not reject claim.', false);
    }
  }

  const pendingClaims = claims.filter(c => c.status === 'Pending');

  return (
    <div className="space-y-6 fade-in-up">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-blue-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Admin Control</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">NGO Requests & Partnerships</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage NGO claims for surplus food redistribution and partner contact information</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1 w-fit border border-gray-200 dark:border-gray-700">
        <button onClick={() => setTab('claims')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'claims' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-500'}`}>
          Surplus Claims (Student & NGO) {pendingClaims.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingClaims.length} pending</span>}
        </button>
        <button onClick={() => setTab('contacts')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'contacts' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-500'}`}>
          Partner Contacts ({ngos.length})
        </button>
      </div>

      {tab === 'claims' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-300">
            🤝 Approved surplus claims deduct leftover food from the board and mark food as successfully redistributed or donated.
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm animate-pulse">Loading claims…</div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No food claims recorded yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claims.map(c => (
                <div key={c.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40' :
                          c.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40' :
                          'bg-red-100 text-red-700 dark:bg-red-900/40'
                        }`}>
                          {c.status}
                        </span>
                        <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          {c.claim_type || (c.ngo_name ? 'NGO' : 'Student')}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={11}/> {new Date(c.claimed_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{c.ngo_name || c.student_name || 'Claimant'}</h4>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{c.quantity_kg} kg Requested</p>
                    <p className="text-xs text-gray-400 mt-1">{c.surplus_description || 'Surplus Item'}</p>
                    {c.notes && <p className="text-[11px] text-gray-500 italic mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">"{c.notes}"</p>}
                  </div>

                  {c.status === 'Pending' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <button onClick={() => handleApprove(c.id)} className="flex-1 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                        <CheckCircle2 size={14}/> Approve
                      </button>
                      <button onClick={() => handleReject(c.id)} className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                        <XCircle size={14}/> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'contacts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add / Edit NGO Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-fit">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              {editNgo ? `Edit NGO: ${editNgo.name}` : 'Register NGO Partner'}
            </h3>

            {editNgo ? (
              <form onSubmit={handleUpdateNGO} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">NGO Name</label>
                  <input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={INP}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                  <input type="email" required value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={INP}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
                  <input required value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className={INP}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">City</label>
                  <input required value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} className={INP}/>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Save Changes</button>
                  <button type="button" onClick={() => setEditNgo(null)} className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddNGO} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">NGO Name</label>
                  <input placeholder="e.g. Feeding Hope Foundation" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={INP}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                  <input type="email" placeholder="contact@feedinghope.org" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={INP}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
                  <input placeholder="+91 98765 43210" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={INP}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">City</label>
                  <input placeholder="e.g. Ahmedabad" required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={INP}/>
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold mt-1">
                  + Register NGO
                </button>
              </form>
            )}
          </div>

          {/* Contacts List */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 lg:col-span-2 space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Registered NGO Partners ({ngos.length})</h3>
            {ngos.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No NGO contacts added yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ngos.map(n => (
                  <div key={n.id} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{n.name}</h4>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(n)} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 size={14}/></button>
                          <button onClick={() => handleDeleteNGO(n.id, n.name)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1"><MapPin size={12} className="text-blue-500"/> {n.city}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1"><Phone size={12} className="text-green-500"/> {n.phone}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5"><Mail size={12} className="text-purple-500"/> {n.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
