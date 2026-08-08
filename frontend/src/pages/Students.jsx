import { useEffect, useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { getStudents } from '../api.js';
import client from '../api.js';

const INP = 'w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 transition-colors';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [form,     setForm]     = useState({ name:'', room_no:'', dietary_pref:'' });
  const [toast,    setToast]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  function flash(msg, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); }

  async function load() {
    setLoading(true);
    try {
      const r = await getStudents();
      const list = Array.isArray(r) ? r : (r?.data || []);
      setStudents(list);
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); },[]);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await client.post('/students/', form);
      flash('Student added!');
      setForm({ name:'', room_no:'', dietary_pref:'' });
      load();
    } catch { flash('Failed to add student.', false); }
  }

  const filtered = students.filter(s=>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.room_no.toLowerCase().includes(search.toLowerCase())
  );

  const prefs = [...new Set(students.map(s=>s.dietary_pref).filter(Boolean))];

  return (
    <div className="space-y-5 fade-in-up">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white
          ${toast.ok?'bg-green-600':'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Management</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Students</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{students.length} registered students</p>
      </div>

      {/* Pref breakdown */}
      {prefs.length>0 && (
        <div className="flex flex-wrap gap-2">
          {prefs.map(p=>(
            <span key={p} className="text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full border border-green-100 dark:border-green-900/30">
              {p}: {students.filter(s=>s.dietary_pref===p).length} students
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Add form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={16} className="text-green-600"/>
            <h3 className="font-semibold text-gray-900 dark:text-white">Add Student</h3>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            {[['Full Name','name','text','e.g. Dhwan Patel'],['Room No','room_no','text','e.g. A-101']].map(([l,k,t,p])=>(
              <div key={k}>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{l}</label>
                <input type={t} placeholder={p} required value={form[k]}
                  onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className={INP}/>
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Dietary Preference</label>
              <select value={form.dietary_pref} onChange={e=>setForm(f=>({...f,dietary_pref:e.target.value}))} className={INP}>
                <option value="">None specified</option>
                {['Vegetarian','Vegan','Jain','Gluten-free','Non-vegetarian'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors mt-1">
              Add Student
            </button>
          </form>
        </div>

        {/* Students list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name or room…" className={`${INP} flex-1`}/>
          </div>
          {loading ? (
            <div className="text-center py-10 text-gray-400 pulse-soft text-sm">Loading…</div>
          ) : filtered.length===0 ? (
            <div className="text-center py-10">
              <Users size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-2"/>
              <p className="text-sm text-gray-400">{search ? 'No students match your search' : 'No students yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(s=>(
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Room {s.room_no}</p>
                  </div>
                  {s.dietary_pref && (
                    <span className="text-[11px] font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-900/30 shrink-0">
                      {s.dietary_pref}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
