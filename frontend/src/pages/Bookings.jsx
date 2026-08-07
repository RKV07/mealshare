import { useEffect, useState } from "react";
import { CheckCircle, UserPlus } from "lucide-react";
import client from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const card = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6";
const inp  = "w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none border border-gray-200 dark:border-gray-700 focus:border-primary bg-gray-50 dark:bg-gray-800 text-ink dark:text-gray-100";

function tomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function Bookings() {
  const { account } = useAuth();
  const isAdmin = !!account?.is_admin;

  const [bookings,     setBookings]     = useState([]);
  const [counts,       setCounts]       = useState({});
  const [form,         setForm]         = useState({ meal_type: "Lunch", date: tomorrow() });
  const [msg,          setMsg]          = useState({ text: "", ok: true });
  const [tab,          setTab]          = useState("my");

  // Admin-only state
  const [students,     setStudents]     = useState([]);
  const [regForm,      setRegForm]      = useState({ student_id: "", meal_type: "Lunch", date: tomorrow() });
  const [allBookings,  setAllBookings]  = useState([]);

  function flash(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: "", ok: true }), 3500);
  }

  async function load() {
    try {
      const data = await client.get("/bookings/").then(r => r.data);
      setBookings(data);
      const results = await Promise.all(
        ["Breakfast","Lunch","Dinner"].map(t =>
          client.get("/bookings/count/", { params: { meal_type: t } }).then(r => r.data)
        )
      );
      const c = {};
      results.forEach(r => { c[r.meal_type] = r.booked_count; });
      setCounts(c);
    } catch {}
  }

  async function loadAdminData() {
    if (!isAdmin) return;
    try {
      const [studentData, bookingData] = await Promise.all([
        client.get("/students/").then(r => r.data),
        client.get("/bookings/all/").then(r => r.data),
      ]);
      setStudents(studentData);
      setAllBookings(bookingData);
    } catch {}
  }

  useEffect(() => { load(); loadAdminData(); }, []);

  async function handleBook(e) {
    e.preventDefault();
    try {
      await client.post("/bookings/", form);
      flash("Meal booked!");
      load();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.non_field_errors?.[0]
        || data?.detail
        || (typeof data === 'string' ? data : null)
        || "Booking failed. Please try again.";
      flash(msg, false);
    }
  }

  async function handleCancel(id) {
    try { await client.delete(`/bookings/${id}/`); load(); loadAdminData(); }
    catch { flash("Could not cancel.", false); }
  }

  async function handleAdminRegister(e) {
    e.preventDefault();
    if (!regForm.student_id) { flash("Pick a student first.", false); return; }
    try {
      await client.post("/bookings/register/", regForm);
      flash("Student registered for the meal!");
      loadAdminData();
    } catch (err) {
      flash(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || "Could not register student.", false);
    }
  }

  async function handleMarkAttended(id) {
    try {
      await client.post(`/bookings/${id}/attend/`);
      flash("Marked as attended.");
      loadAdminData();
    } catch (err) {
      flash(err.response?.data?.error || "Could not mark attendance.", false);
    }
  }

  return (
    <>
      <div className="mb-2">
        <h2 className="text-xl font-bold text-ink dark:text-gray-100">Meal Bookings</h2>
        <p className="text-sm text-inkSoft dark:text-gray-400">
          {isAdmin ? "Book your own meals, or register students manually" : "Book meals in advance for the mess"}
        </p>
      </div>

      {/* Headcount cards */}
      <div className="grid grid-cols-3 gap-4">
        {["Breakfast","Lunch","Dinner"].map(t => (
          <div key={t} className={`${card} text-center`}>
            <p className="text-xs font-semibold text-inkSoft dark:text-gray-400 uppercase tracking-wide mb-1">{t}</p>
            <p className="text-3xl font-bold text-primary">{counts[t] || 0}</p>
            <p className="text-xs text-inkSoft dark:text-gray-500 mt-1">booked for tomorrow</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      {isAdmin && (
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          {[["my","My Bookings"],["register","Register Students (Admin)"]].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === key
                  ? "bg-white dark:bg-gray-900 text-ink dark:text-gray-100 shadow-sm"
                  : "text-inkSoft dark:text-gray-400"
              }`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {msg.text && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {msg.text}
        </div>
      )}

      {/* My Bookings tab */}
      {tab === "my" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={card}>
            <h3 className="font-semibold text-ink dark:text-gray-100 mb-4">Book a Meal</h3>
            <form onSubmit={handleBook} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-inkSoft dark:text-gray-400">Meal Type</label>
                <select value={form.meal_type} onChange={e => setForm(f => ({...f, meal_type: e.target.value}))} className={inp}>
                  <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-inkSoft dark:text-gray-400">Date</label>
                <input type="date" value={form.date} min={tomorrow()}
                  onChange={e => setForm(f => ({...f, date: e.target.value}))} className={inp} />
              </div>
              <button type="submit" className="py-2.5 rounded-xl text-sm font-semibold text-white bg-primary mt-1">
                Book Meal
              </button>
            </form>
          </div>

          <div className={`${card} lg:col-span-2`}>
            <h3 className="font-semibold text-ink dark:text-gray-100 mb-4">Your Bookings ({bookings.length})</h3>
            {bookings.length === 0
              ? <p className="text-sm text-inkSoft dark:text-gray-400">No bookings yet.</p>
              : (
                <div className="flex flex-col gap-2">
                  {bookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={18} className={b.attended ? "text-success shrink-0" : "text-inkSoft/40 shrink-0"} />
                        <div>
                          <p className="text-sm font-medium text-ink dark:text-gray-100">{b.meal_type}</p>
                          <p className="text-xs text-inkSoft dark:text-gray-400">
                            {b.date} · {b.attended ? "✓ Attended" : "Registered"}
                            {b.registered_by_admin ? " · Registered by admin" : ""}
                          </p>
                        </div>
                      </div>
                      {!b.attended && (
                        <button onClick={() => handleCancel(b.id)}
                          className="text-xs text-danger border border-danger/20 bg-danger/5 px-3 py-1.5 rounded-lg hover:bg-danger/10 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* Admin: Register Students tab */}
      {tab === "register" && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={card}>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={18} className="text-primary" />
              <h3 className="font-semibold text-ink dark:text-gray-100">Register a Student</h3>
            </div>
            <form onSubmit={handleAdminRegister} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-inkSoft dark:text-gray-400">Student</label>
                <select value={regForm.student_id} onChange={e => setRegForm(f => ({...f, student_id: e.target.value}))} className={inp}>
                  <option value="">Select a student…</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — Room {s.room_no}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-inkSoft dark:text-gray-400">Meal Type</label>
                <select value={regForm.meal_type} onChange={e => setRegForm(f => ({...f, meal_type: e.target.value}))} className={inp}>
                  <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-inkSoft dark:text-gray-400">Date</label>
                <input type="date" value={regForm.date} min={tomorrow()}
                  onChange={e => setRegForm(f => ({...f, date: e.target.value}))} className={inp} />
              </div>
              <button type="submit" className="py-2.5 rounded-xl text-sm font-semibold text-white bg-primary mt-1">
                Register Student
              </button>
            </form>
          </div>

          <div className={`${card} lg:col-span-2`}>
            <h3 className="font-semibold text-ink dark:text-gray-100 mb-4">All Bookings ({allBookings.length})</h3>
            {allBookings.length === 0
              ? <p className="text-sm text-inkSoft dark:text-gray-400">No bookings yet.</p>
              : (
                <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
                  {allBookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={18} className={b.attended ? "text-success shrink-0" : "text-inkSoft/40 shrink-0"} />
                        <div>
                          <p className="text-sm font-medium text-ink dark:text-gray-100">{b.meal_type} · {b.date}</p>
                          <p className="text-xs text-inkSoft dark:text-gray-400">
                            {b.attended ? "✓ Attended" : "Registered"}
                            {b.registered_by_admin ? " · Registered by admin" : " · Self-booked"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!b.attended && (
                          <button onClick={() => handleMarkAttended(b.id)}
                            className="text-xs text-success border border-success/20 bg-success/5 px-3 py-1.5 rounded-lg hover:bg-success/10 transition-colors">
                            Mark Attended
                          </button>
                        )}
                        <button onClick={() => handleCancel(b.id)}
                          className="text-xs text-danger border border-danger/20 bg-danger/5 px-3 py-1.5 rounded-lg hover:bg-danger/10 transition-colors">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}
    </>
  );
}
