
import React, { useMemo } from 'react';
import { 
  Coffee, AlertCircle, Clock, CheckCircle2, Truck, 
  MoreVertical, Search, Filter, BarChart3, TrendingUp, History 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie 
} from 'recharts';
import { DatabaseState, GuestRequest, RequestStatus } from '../types';

interface AdminCortexProps {
  db: DatabaseState;
  onDispatch: (id: string) => void;
  onComplete: (id: string) => void;
}

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const styles = {
    open: 'bg-blue-100 text-blue-700',
    merged: 'bg-purple-100 text-purple-700',
    confirmed: 'bg-amber-100 text-amber-700',
    dispatched: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] ?? styles.open}`}>
      {status}
    </span>
  );
};

const AdminCortex: React.FC<AdminCortexProps> = ({ db, onDispatch, onComplete }) => {
  const safeRequests = db?.requests ?? [];

  const activeRequests = safeRequests
    .filter(r => r.status !== 'completed')
    .sort((a, b) => ((b.analysis?.severity ?? 0) - (a.analysis?.severity ?? 0)));
  const completedRequests = safeRequests
    .filter(r => r.status === 'completed')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 

  // Data transformations for graphs
  const chartData = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => {
      const h = new Date();
      h.setHours(h.getHours() - (11 - i));
      return h.getHours();
    });

    return hours.map(h => ({
      name: `${h}:00`,
      requests: safeRequests.filter(r => new Date(r.timestamp).getHours() === h).length,
    }));
  }, [safeRequests]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    safeRequests.forEach(r => {
      if (!r?.category) return;
      counts[r.category] = (counts[r.category] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: i % 2 === 0 ? '#6366f1' : '#f43f5e'
    }));
  }, [safeRequests]);

  // Statistics for summary cards
  const stats = useMemo(() => [
    { label: 'Pending Dispatch', count: safeRequests.filter(r => r.status === 'confirmed').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
    { label: 'Active Service', count: safeRequests.filter(r => r.status === 'dispatched').length, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Truck },
    { label: 'Urgent Tasks', count: safeRequests.filter(r => (r.analysis?.severity ?? 0) >= 4 && r.status !== 'completed').length, color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle },
    { label: 'Today Completed', count: completedRequests.length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  ], [safeRequests, completedRequests]);

  return (
    <div className="p-8 h-full overflow-y-auto space-y-8 bg-slate-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cortex Command Center</h1>
          <p className="text-slate-500 text-sm">Real-time intelligence and fleet management.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by guest or ID..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm font-medium shadow-sm transition-all">
            <Filter className="w-4 h-4" />
            Advanced Filter
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800">Service Velocity (Last 12h)</h3>
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">+12% from yesterday</span>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800">Request Mix</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieData.map((d, i) => (
                <div key={i} className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">{d.name}</span>
                  <span className="text-lg font-bold text-slate-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Queue */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Live Dispatch Queue
            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Live Now</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col border-l-4 border-l-indigo-500">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${(req.category ?? '').toLowerCase().includes('food') ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                      {(req.category ?? '').toLowerCase().includes('food') ? <Coffee className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">GUEST {req.chat_id.slice(-4).toUpperCase()}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {req.id.slice(-6)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <StatusBadge status={req.status} />
                  </div>
                </div>

                <div className="mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-700 font-medium italic">"{req.structured_data}"</p>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <span>Intelligence Protocol</span>
                     <span className={`${(req.analysis?.severity ?? 0) >= 4 ? 'text-rose-500' : 'text-emerald-500'}`}>
                       Score: {req.analysis?.severity ?? 0}/5
                     </span> 
                   </div>
                   <div className="space-y-1">
                     {(req.analysis?.protocol_steps ?? []).slice(0, 3).map((step, idx) => (
                       <div key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                         <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                         <span className="truncate">{step}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 font-medium">
                  {new Date(req.timestamp || Date.now()).toLocaleTimeString()}
                </div>
                <div className="flex gap-2">
                  {req.status === 'confirmed' && (
                    <button 
                      onClick={() => onDispatch(req.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Dispatch
                    </button>
                  )}
                  {req.status === 'dispatched' && (
                    <button 
                      onClick={() => onComplete(req.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {activeRequests.length === 0 && (
            <div className="lg:col-span-3 py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium italic">All service loops currently closed.</p>
            </div>
          )}
        </div>
      </section>

      {/* Resolution History - Separated View */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tighter">Resolution Archive</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">{completedRequests.length} Tasks Archived</span>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Request</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Resolution Data</th>
                  <th className="px-6 py-3 font-semibold text-right">Archived At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {completedRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-indigo-500">#{req.id.slice(-6)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(req.category ?? '').toLowerCase().includes('food') ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                        {req.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 truncate max-w-[300px] font-medium italic">"{req.structured_data}"</td>
                    <td className="px-6 py-4 text-[10px] text-slate-400 text-right font-medium">
                      {new Date(req.timestamp || Date.now()).toLocaleDateString()} {new Date(req.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                  </tr>
                ))}
                {completedRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">No completed tasks in the record bank.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminCortex;
