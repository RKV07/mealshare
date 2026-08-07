import { useEffect, useState } from 'react';
import { HeartHandshake, PackageOpen, Clock, CheckCircle2, XCircle, ArrowRight, Building2, MapPin, Phone } from 'lucide-react';
import { getNGODashboardStats } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

export default function NGODashboard() {
  const { account } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNGODashboardStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats?.cards || {
    available_surplus_count: 0,
    available_surplus_kg: 0,
    pending_claims: 0,
    approved_claims: 0,
    rejected_claims: 0,
    total_donated_kg: 0,
  };

  const recentClaims = stats?.recent_claims || [];

  return (
    <div className="space-y-6 fade-in-up font-[Outfit,sans-serif]">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
              <HeartHandshake size={14}/> NGO Partner Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-black">Welcome, {account?.name || 'Partner NGO'}!</h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-xl">
              Claim surplus mess food to distribute to communities in need. Claims require mess admin approval.
            </p>
          </div>
          <Link
            to="/ngo/surplus"
            className="px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 shrink-0"
          >
            <PackageOpen size={16} /> Browse Surplus Food <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Partner Info Snippet */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold">
            <Building2 size={18}/>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{account?.name || 'NGO Organization'}</p>
            <p className="text-gray-400">Reg No: {account?.registration_no || 'Registered Partner'}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500"/> {account?.city || 'Location'}</div>
          <div className="flex items-center gap-1.5"><Phone size={14} className="text-green-500"/> {account?.phone || 'Contact'}</div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available Surplus', value: `${cards.available_surplus_kg} kg`, sub: `${cards.available_surplus_count} items ready`, icon: PackageOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Pending Approvals', value: cards.pending_claims, sub: 'Awaiting mess admin', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Approved Claims', value: cards.approved_claims, sub: 'Successfully claimed', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Received', value: `${cards.total_donated_kg} kg`, sub: 'Rescued food total', icon: HeartHandshake, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">{c.label}</span>
                <div className={`p-2 rounded-xl ${c.bg} ${c.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{c.value}</p>
              <p className="text-[11px] text-gray-400">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Claims Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Recent Claim Requests</h3>
            <p className="text-xs text-gray-400">Track real-time status of your food claim requests</p>
          </div>
          <Link to="/ngo/claims" className="text-xs font-bold text-blue-600 hover:underline">View All Claims &rarr;</Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-gray-400 animate-pulse">Loading claim records…</div>
        ) : recentClaims.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-400">
            No claims submitted yet.{' '}
            <Link to="/ngo/surplus" className="text-blue-600 font-bold hover:underline">Claim surplus food here</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentClaims.map((claim) => (
              <div key={claim.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      claim.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      claim.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {claim.status}
                    </span>
                    <span className="text-[11px] text-gray-400">Claim #{claim.id}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{claim.surplus_description || 'Surplus Food Meal'}</p>
                  {claim.notes && <p className="text-[11px] text-gray-400 italic mt-0.5">"{claim.notes}"</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{claim.quantity_kg} kg Requested</p>
                  <p className="text-[10px] text-gray-400">{new Date(claim.claimed_at).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
