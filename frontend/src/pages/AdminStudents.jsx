import { useEffect, useState } from 'react';
import { Users, UserPlus, Edit3, Trash2, Search, X, Check } from 'lucide-react';
import { getStudents, addStudent, updateStudent, deleteStudent } from '../api.js';

const INP = 'w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 transition-all';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Form states
  const [form, setForm] = useState({ name: '', room_no: '', dietary_pref: '' });
  const [editStudent, setEditStudent] = useState(null); // when editing a student
  const [editForm, setEditForm] = useState({ name: '', room_no: '', dietary_pref: '' });

  function flash(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await getStudents();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setStudents(list);
    } catch {
      flash('Failed to load students list', false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await addStudent(form);
      flash('Student added successfully!');
      setForm({ name: '', room_no: '', dietary_pref: '' });
      load();
    } catch {
      flash('Failed to add student.', false);
    }
  }

  function startEdit(s) {
    setEditStudent(s);
    setEditForm({ name: s.name, room_no: s.room_no, dietary_pref: s.dietary_pref || '' });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editStudent) return;
    try {
      await updateStudent(editStudent.id, editForm);
      flash('Student profile updated!');
      setEditStudent(null);
      load();
    } catch {
      flash('Failed to update student.', false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteStudent(id);
      flash('Student deleted.');
      load();
    } catch {
      flash('Could not delete student.', false);
    }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.room_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 fade-in-up">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-purple-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Admin Control</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total {students.length} registered students in system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel: Add / Edit */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={18} className="text-purple-600"/>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {editStudent ? `Edit Student: ${editStudent.name}` : 'Add New Student'}
            </h3>
          </div>

          {editStudent ? (
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Full Name</label>
                <input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={INP}/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Room No.</label>
                <input required value={editForm.room_no} onChange={e => setEditForm(f => ({ ...f, room_no: e.target.value }))} className={INP}/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Dietary Preference</label>
                <select value={editForm.dietary_pref} onChange={e => setEditForm(f => ({ ...f, dietary_pref: e.target.value }))} className={INP}>
                  <option value="">None</option>
                  {['Vegetarian','Vegan','Jain','Gluten-free','Non-vegetarian'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-1">
                  <Check size={14}/> Save Changes
                </button>
                <button type="button" onClick={() => setEditStudent(null)} className="px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Full Name</label>
                <input placeholder="e.g. Rahul Sharma" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={INP}/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Room No.</label>
                <input placeholder="e.g. B-204" required value={form.room_no} onChange={e => setForm(f => ({ ...f, room_no: e.target.value }))} className={INP}/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Dietary Preference</label>
                <select value={form.dietary_pref} onChange={e => setForm(f => ({ ...f, dietary_pref: e.target.value }))} className={INP}>
                  <option value="">None specified</option>
                  {['Vegetarian','Vegan','Jain','Gluten-free','Non-vegetarian'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors mt-1">
                + Add Student
              </button>
            </form>
          )}
        </div>

        {/* Student List & Search */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or room number…" className={`${INP} pl-10`}/>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm animate-pulse">Loading student records…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              <Users size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-2"/>
              <p>{search ? 'No students matching search criteria.' : 'No students registered.'}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filtered.map(s => (
                <div key={s.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:border-purple-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{s.name}</p>
                      <p className="text-xs text-gray-400">Room: {s.room_no} {s.username ? `· @${s.username}` : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {s.dietary_pref && (
                      <span className="text-[11px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2.5 py-1 rounded-full hidden sm:inline-block">
                        {s.dietary_pref}
                      </span>
                    )}
                    <button onClick={() => startEdit(s)} className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors" title="Edit">
                      <Edit3 size={15}/>
                    </button>
                    <button onClick={() => handleDelete(s.id, s.name)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Delete">
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
