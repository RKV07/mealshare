import { useState } from 'react';
import { Leaf, Sun, Moon, ArrowRight, ShieldCheck, HeartHandshake, GraduationCap, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNavigate } from 'react-router-dom';

const INP = 'w-full px-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all';

export default function Home() {
  const { login, register } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login or register
  const [role, setRole] = useState('student'); // student, ngo, admin
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '', password: '', name: '', room_no: '',
    email: '', dietary_pref: '', phone: '', city: '',
    registration_no: '', admin_code: ''
  });

  const up = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      let res;
      if (mode === 'login') {
        res = await login(form.username, form.password);
      } else {
        res = await register({ ...form, role });
      }

      const userRole = res?.role || (res?.is_admin ? 'admin' : 'student');

      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'ngo') {
        navigate('/ngo/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const d = err.response?.data;
      const msg = d ? (typeof d === 'string' ? d : Object.values(d)[0]) : 'Something went wrong.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 flex items-center justify-center p-5 font-[Outfit,sans-serif]">
      <button onClick={toggle}
        className="fixed top-5 right-5 w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors z-10">
        {dark ? <Sun size={16}/> : <Moon size={16}/>}
      </button>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left panel */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Leaf size={22} color="#fff"/>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">MealShare</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">
            Log meals.<br/>Share surplus.<br/><span className="text-emerald-600 dark:text-emerald-400">Waste less.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-8">
            MealShare connects mess admins, students, and NGOs to reduce food waste through smart tracking, surplus food redistribution, and ML demand forecasting.
          </p>
          <div className="space-y-3">
            {[
              ['🎓', 'Students', 'Book meals in advance & view daily menu schedules'],
              ['🤝', 'NGO Partners', 'Claim surplus food & manage pickup approvals'],
              ['🛡️', 'Mess Admins', 'Log prepared food, approve NGO requests & optimize inventory'],
              ['🤖', 'AI/ML Engine', 'Predict meal demand to prevent waste before it happens'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 shadow-sm backdrop-blur-sm">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auth card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-7 md:p-8">
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
              <Leaf size={17} color="#fff"/>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">MealShare</span>
          </div>

          {/* Mode Switcher: Login / Register */}
          <div className="flex bg-gray-100 dark:bg-gray-800/80 rounded-2xl p-1 mb-6 border border-gray-200/50 dark:border-gray-700/50">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === m ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                {m === 'login' ? 'Log In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {mode === 'login' ? 'Welcome back to MealShare' : 'Join MealShare Platform'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            Select your role to {mode === 'login' ? 'log in to your dashboard' : 'create your account'}
          </p>

          {/* Explicit Role Selection (Student, NGO, Admin) */}
          <div className="mb-5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Select Role / Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'student', label: 'Student', icon: GraduationCap, color: 'emerald' },
                { id: 'ngo', label: 'NGO / Partner', icon: HeartHandshake, color: 'blue' },
                { id: 'admin', label: 'Mess Admin', icon: ShieldCheck, color: 'purple' },
              ].map(r => {
                const Icon = r.icon;
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setRole(r.id); setError(''); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <Icon size={18} className={`mb-1 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Registration Fields */}
            {mode === 'register' && (
              <>
                {role === 'student' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Full Name</label>
                        <input placeholder="Alex Morgan" value={form.name} onChange={up('name')} required className={INP}/>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Room / Hostel No.</label>
                        <input placeholder="Hostel B-204" value={form.room_no} onChange={up('room_no')} required className={INP}/>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Dietary Preference <span className="text-gray-400">(optional)</span></label>
                      <select value={form.dietary_pref} onChange={up('dietary_pref')} className={INP}>
                        <option value="">No special preference</option>
                        {['Vegetarian','Vegan','Jain','Gluten-free','Non-vegetarian'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {role === 'ngo' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">NGO / Organization Name</label>
                      <input placeholder="Feeding Hope Foundation" value={form.name} onChange={up('name')} required className={INP}/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Contact Phone</label>
                        <input placeholder="+91 98765 43210" value={form.phone} onChange={up('phone')} required className={INP}/>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">City</label>
                        <input placeholder="Ahmedabad" value={form.city} onChange={up('city')} required className={INP}/>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">NGO Registration / License No. <span className="text-gray-400">(optional)</span></label>
                      <input placeholder="REG-2024-8849" value={form.registration_no} onChange={up('registration_no')} className={INP}/>
                    </div>
                  </>
                )}

                {role === 'admin' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Admin Full Name</label>
                      <input placeholder="Mess Manager" value={form.name} onChange={up('name')} required className={INP}/>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Admin Secret Code</label>
                      <input type="password" placeholder="Enter admin secret code" value={form.admin_code} onChange={up('admin_code')} required className={INP}/>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Email Address</label>
                  <input type="email" placeholder="email@example.com" value={form.email} onChange={up('email')} required={role === 'ngo'} className={INP}/>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Username</label>
              <input placeholder="username" value={form.username} onChange={up('username')} required autoComplete="username" className={INP}/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={up('password')} required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={INP}/>
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-800">{error}</p>}

            <button type="submit" disabled={busy}
              className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-colors mt-3">
              {busy ? 'Processing…' : mode === 'login' ? `Log In as ${role.toUpperCase()}` : `Create ${role.toUpperCase()} Account`}
              {!busy && <ArrowRight size={16}/>}
            </button>
          </form>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              {mode === 'login' ? 'Register now' : 'Log in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
