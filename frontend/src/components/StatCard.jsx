export default function StatCard({ label, value, unit, icon: Icon, color = 'green', trend }) {
  const colors = {
    green:  { bg: 'bg-green-50 dark:bg-green-900/20',   icon: 'bg-green-600',  text: 'text-green-600 dark:text-green-400' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',     icon: 'bg-blue-600',   text: 'text-blue-600 dark:text-blue-400' },
    red:    { bg: 'bg-red-50 dark:bg-red-900/20',       icon: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400' },
  };
  const c = colors[color] || colors.green;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 card-hover fade-in-up">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center`}>
          <Icon size={18} color="#fff" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{value}</p>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {unit && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{unit}</p>}
    </div>
  );
}
