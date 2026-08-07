import { Sun, Moon, LogOut, ShieldCheck, GraduationCap, HeartHandshake } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ title }) {
  const { dark, toggle } = useTheme();
  const { account, logout } = useAuth();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const role = account?.role || (account?.is_admin ? 'admin' : 'student');
  const isAdmin = role === 'admin';
  const isNGO = role === 'ngo';

  const avatarBg = isAdmin
    ? 'bg-gradient-to-br from-purple-600 to-purple-400'
    : isNGO
    ? 'bg-gradient-to-br from-blue-600 to-cyan-500'
    : 'bg-gradient-to-br from-green-600 to-green-400';

  const displayName = account?.name || account?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-14 px-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
      <div>
        <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:block">{today}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <IconBtn onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? <Sun size={16}/> : <Moon size={16}/>}
        </IconBtn>
        {account && (
          <div className="flex items-center gap-2 ml-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarBg}`}>
              {initial}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-none">{displayName}</p>
              <p className="text-[10px] mt-0.5 flex items-center gap-1 text-gray-400">
                {isAdmin ? (
                  <><ShieldCheck size={10} className="text-purple-500"/> Admin</>
                ) : isNGO ? (
                  <><HeartHandshake size={10} className="text-blue-500"/> NGO Partner</>
                ) : (
                  <><GraduationCap size={10} className="text-green-500"/> Student</>
                )}
              </p>
            </div>
            <IconBtn onClick={logout} title="Log out" danger><LogOut size={15}/></IconBtn>
          </div>
        )}
      </div>
    </header>
  );
}

function IconBtn({ children, danger, ...props }) {
  return (
    <button {...props}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
        danger
          ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}>
      {children}
    </button>
  );
}
