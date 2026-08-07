import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackageOpen, Users, BarChart3, BookOpen, ShoppingBasket, Leaf, ChevronLeft, ChevronRight, HandHeart, Utensils, HeartHandshake } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard', end: true },
  { to: '/admin/students',  icon: Users,           label: 'User Management' },
  { to: '/admin/meals',     icon: Utensils,        label: 'Meal Management' },
  { to: '/admin/bookings',  icon: BookOpen,        label: 'Meal Bookings' },
  { to: '/admin/ngo',       icon: HandHeart,       label: 'NGO Requests' },
  { to: '/admin/inventory', icon: ShoppingBasket,  label: 'Inventory' },
  { to: '/admin/reports',   icon: BarChart3,       label: 'Reports & Analytics' },
];

const ngoNav = [
  { to: '/ngo/dashboard', icon: LayoutDashboard, label: 'NGO Dashboard', end: true },
  { to: '/ngo/surplus',   icon: PackageOpen,     label: 'Surplus Food Board' },
  { to: '/ngo/claims',    icon: HeartHandshake,  label: 'My Food Claims' },
];

const studentNav = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'My Dashboard', end: true },
  { to: '/student/bookings',  icon: BookOpen,        label: 'Book Meals' },
  { to: '/student/surplus',   icon: PackageOpen,     label: 'Surplus Board' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const { account } = useAuth();
  const role = account?.role || (account?.is_admin ? 'admin' : 'student');
  const isAdmin = role === 'admin';
  const isNGO = role === 'ngo';

  const visibleNav = isAdmin ? adminNav : isNGO ? ngoNav : studentNav;

  const badgeTheme = isAdmin
    ? { bg: 'bg-gradient-to-br from-purple-600 to-purple-400', text: 'text-purple-600 dark:text-purple-400', label: 'Admin Console', activeClass: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold', bar: 'bg-purple-600' }
    : isNGO
    ? { bg: 'bg-gradient-to-br from-blue-600 to-cyan-500', text: 'text-blue-600 dark:text-blue-400', label: 'NGO Portal', activeClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold', bar: 'bg-blue-600' }
    : { bg: 'bg-gradient-to-br from-green-600 to-emerald-400', text: 'text-green-600 dark:text-green-400', label: 'Student Portal', activeClass: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold', bar: 'bg-green-600' };

  return (
    <aside className={`hidden md:flex flex-col shrink-0 transition-all duration-300 ${open ? 'w-56' : 'w-16'} p-3`}>
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-3">

        {/* Brand */}
        <div className={`flex items-center gap-2.5 px-2 py-3 mb-3 ${!open && 'justify-center'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${badgeTheme.bg}`}>
            <Leaf size={15} color="#fff" />
          </div>
          {open && (
            <div>
              <span className="font-bold text-[15px] tracking-tight text-gray-900 dark:text-white block leading-none">MealShare</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mt-0.5 ${badgeTheme.text}`}>
                {badgeTheme.label}
              </span>
            </div>
          )}
        </div>

        {open && <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 mb-2">{badgeTheme.label} Menu</p>}

        {/* Links */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {visibleNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={label} to={to} end={end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all
                 ${isActive
                   ? badgeTheme.activeClass
                   : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                 } ${!open && 'justify-center'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && open && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${badgeTheme.bar}`} />
                  )}
                  <Icon size={16} className="shrink-0" />
                  {open && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse */}
        <button onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!open && 'justify-center'}`}>
          {open ? <><ChevronLeft size={15}/><span>Collapse</span></> : <ChevronRight size={15}/>}
        </button>
      </div>
    </aside>
  );
}