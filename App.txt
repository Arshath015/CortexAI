
import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, MessageSquare, Database, Settings, LogOut, Coffee, AlertCircle } from 'lucide-react';
import { DatabaseState, ChatMessage, GuestRequest, RequestStatus } from './types';
import GuestLink from './components/GuestLink';
import AdminCortex from './components/AdminCortex';
import SystemInternals from './components/SystemInternals';

const STORAGE_KEY = 'cortex_db_v1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guest' | 'admin' | 'internals'>('guest');
  const [chatId] = useState(`chat_${Math.random().toString(36).substr(2, 9)}`);
  const [db, setDb] = useState<DatabaseState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { requests: [], messages: [] };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    setDb(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  const updateRequest = useCallback((req: GuestRequest) => {
    setDb(prev => {
      const exists = prev.requests.findIndex(r => r.id === req.id);
      if (exists !== -1) {
        const newReqs = [...prev.requests];
        newReqs[exists] = req;
        return { ...prev, requests: newReqs };
      }
      return { ...prev, requests: [...prev.requests, req] };
    });
  }, []);

  const handleDispatch = (requestId: string) => {
    const req = db.requests.find(r => r.id === requestId);
    if (req) {
      const dispatchId = `disp_${Math.random().toString(36).substr(2, 6)}`;
      updateRequest({
        ...req,
        status: 'dispatched',
        dispatch_id: dispatchId
      });
      // Notify Guest
      addMessage({
        chat_id: req.chat_id,
        sender: 'agent',
        text: `🚀 Your ${req.category.toLowerCase()} (#${req.id.slice(-4)}) has been dispatched! Dispatch ID: ${dispatchId}. Our staff is on the way.`,
        associated_request_id: requestId
      });
    }
  };

  const handleComplete = (requestId: string) => {
    const req = db.requests.find(r => r.id === requestId);
    if (req) {
      updateRequest({
        ...req,
        status: 'completed'
      });
      // Notify Guest
      addMessage({
        chat_id: req.chat_id,
        sender: 'agent',
        text: `✅ Great news! Your ${req.category.toLowerCase()} (#${req.id.slice(-4)}) is now marked as completed. We hope you're satisfied with the service.`,
        associated_request_id: requestId
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col items-center lg:items-stretch py-6">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <h1 className="hidden lg:block text-xl font-bold text-white tracking-tight">Cortex<span className="text-indigo-400">Guest</span></h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('guest')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'guest' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Guest Link</span>
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Admin Cortex</span>
          </button>
          <button 
            onClick={() => setActiveTab('internals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'internals' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Database className="w-5 h-5" />
            <span className="hidden lg:block font-medium">System Internals</span>
          </button>
        </nav>

        <div className="px-4 mt-auto">
          <div className="hidden lg:block p-4 rounded-xl bg-slate-800/50 mb-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 font-semibold mb-2 uppercase">Current Session</p>
            <p className="text-sm text-slate-300 font-mono truncate">{chatId}</p>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Exit</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
        {activeTab === 'guest' && (
          <GuestLink 
            chatId={chatId} 
            db={db} 
            addMessage={addMessage} 
            updateRequest={updateRequest} 
          />
        )}
        {activeTab === 'admin' && (
          <AdminCortex 
            db={db} 
            onDispatch={handleDispatch}
            onComplete={handleComplete}
          />
        )}
        {activeTab === 'internals' && (
          <SystemInternals db={db} />
        )}
      </main>
    </div>
  );
};

export default App;
