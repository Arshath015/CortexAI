
import React from 'react';
import { Database, Code, Terminal, Clock, Activity } from 'lucide-react';
import { DatabaseState } from '../types';

interface SystemInternalsProps {
  db: DatabaseState;
}

const SystemInternals: React.FC<SystemInternalsProps> = ({ db }) => {
  return (
    <div className="p-8 h-full overflow-y-auto space-y-8 bg-slate-900 text-slate-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Terminal className="text-indigo-400" />
            System Internals
          </h1>
          <p className="text-slate-500 text-sm mt-1">Direct state inspection and persistence logs.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-3">
             <Activity className="w-4 h-4 text-emerald-400" />
             <span className="text-sm font-mono text-slate-300">UPTIME: 100%</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Raw Requests DB */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <Database className="w-4 h-4" />
            Table: GUEST_REQUESTS
          </h2>
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 sticky top-0 text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3">CATEGORY</th>
                    <th className="px-4 py-3">STRUCTURED_DATA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {db.requests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3 text-indigo-300">{req.id.slice(-6)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded ${
                          req.status === 'dispatched' ? 'bg-indigo-900 text-indigo-300' :
                          req.status === 'completed' ? 'bg-emerald-900 text-emerald-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{req.category}</td>
                      <td className="px-4 py-3 text-slate-300 truncate max-w-[200px]">{req.structured_data}</td>
                    </tr>
                  ))}
                  {db.requests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-600">NO_RECORDS_FOUND</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Live State JSON */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <Code className="w-4 h-4" />
            Live Memory Dump (JSON)
          </h2>
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 max-h-[500px] overflow-auto">
            <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
              {JSON.stringify(db, null, 2)}
            </pre>
          </div>
        </section>

        {/* Audit Logs */}
        <section className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Interaction Persistence Log
          </h2>
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-2">
            <div className="max-h-[300px] overflow-auto space-y-1">
              {db.messages.slice().reverse().map(msg => (
                <div key={msg.id} className="p-3 hover:bg-slate-900 rounded flex gap-4 text-xs font-mono border-b border-slate-900 last:border-0">
                  <span className="text-slate-600 shrink-0">{new Date(msg.timestamp).toISOString()}</span>
                  <span className={`shrink-0 w-16 font-bold ${msg.sender === 'agent' ? 'text-amber-500' : 'text-indigo-400'}`}>
                    [{msg.sender.toUpperCase()}]
                  </span>
                  <span className="text-slate-400 truncate flex-1">{msg.text}</span>
                  <span className="text-slate-600 shrink-0">CID: {msg.chat_id.slice(-6)}</span>
                </div>
              ))}
              {db.messages.length === 0 && (
                <div className="p-10 text-center text-slate-700 italic">LOG_BUFFER_EMPTY</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemInternals;
