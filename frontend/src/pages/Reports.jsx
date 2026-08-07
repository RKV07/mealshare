import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { getWasteReport, getMealLogs } from '../api.js';

const C = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5';
const COLORS = ['#22c55e','#fbbf24','#3b82f6','#ef4444','#a855f7'];

export default function Reports() {
  const [waste,   setWaste]   = useState(null);
  const [meals,   setMeals]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.all([getWasteReport(), getMealLogs().then(r=>r.data)])
      .then(([w,m])=>{ setWaste(w); setMeals(m); })
      .finally(()=>setLoading(false));
  },[]);

  const byDate = (() => {
    const by={};
    for(const m of meals){
      if(!by[m.date]) by[m.date]={day:m.date.slice(5),Prepared:0,Consumed:0,Waste:0};
      by[m.date].Prepared+=m.prepared_kg;
      by[m.date].Consumed+=m.consumed_kg;
      by[m.date].Waste+=m.prepared_kg-m.consumed_kg;
    }
    return Object.values(by).sort((a,b)=>a.day.localeCompare(b.day)).slice(-14);
  })();

  const byType = (() => {
    const by={};
    for(const m of meals) by[m.meal_type]=(by[m.meal_type]||0)+m.prepared_kg;
    return Object.entries(by).map(([name,value])=>({name,value:+value.toFixed(1)}));
  })();

  const wastePct = byDate.map(d=>({
    day:d.day, waste: d.Prepared ? +((d.Waste/d.Prepared)*100).toFixed(1) : 0
  }));

  if (loading) return <div className="text-center py-20 text-gray-400 pulse-soft text-sm">Loading reports…</div>;

  const stats = [
    { label:'Total Prepared', value:`${(waste?.total_prepared_kg||0).toFixed(1)} kg`, color:'text-blue-600 dark:text-blue-400' },
    { label:'Total Consumed', value:`${(waste?.total_consumed_kg||0).toFixed(1)} kg`, color:'text-green-600 dark:text-green-400' },
    { label:'Total Waste',    value:`${(waste?.total_waste_kg||0).toFixed(1)} kg`,    color:'text-red-500 dark:text-red-400' },
    { label:'Waste Rate',     value:`${waste?.waste_percentage||0}%`,                 color: waste?.waste_percentage>20?'text-red-500':'text-yellow-500' },
  ];

  return (
    <div className="space-y-5 fade-in-up">
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Analytics</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Waste Reports</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track food waste and consumption patterns over time</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s=>(
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className={`${C} xl:col-span-2`}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Prepared vs Consumed</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDate} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:12,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <Bar dataKey="Prepared" fill="#fbbf24" radius={[5,5,0,0]}/>
              <Bar dataKey="Consumed" fill="#22c55e" radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={C}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">By Meal Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {byType.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-3">
            {byType.map((d,i)=>(
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>
                  <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                </div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{d.value} kg</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${C} xl:col-span-3`}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Waste % Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={wastePct}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false} unit="%"/>
              <Tooltip contentStyle={{borderRadius:12,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
              <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={2.5} dot={{r:4}} activeDot={{r:6}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meal log table */}
      <div className={C}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">All Meal Logs ({meals.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Date','Meal','Type','Prepared','Consumed','Surplus'].map(h=>(
                  <th key={h} className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meals.slice(0,20).map(m=>(
                <tr key={m.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 text-gray-600 dark:text-gray-400 text-xs">{m.date}</td>
                  <td className="py-3 font-medium text-gray-800 dark:text-gray-200">{m.meal_name}</td>
                  <td className="py-3"><span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{m.meal_type}</span></td>
                  <td className="py-3 text-gray-700 dark:text-gray-300">{m.prepared_kg} kg</td>
                  <td className="py-3 text-gray-700 dark:text-gray-300">{m.consumed_kg} kg</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold ${m.surplus_kg>0?'text-red-500':'text-green-600'}`}>
                      {m.surplus_kg>0 ? `+${m.surplus_kg} kg` : 'None'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
