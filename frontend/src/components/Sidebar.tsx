import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Building2, Home, MessageSquare, Newspaper, LogOut } from 'lucide-react';

export const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Building2 size={24} className="text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          AVENIR
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl transition-all">
          <Home size={20} />
          <span className="font-medium">Tableau de bord</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all">
          <MessageSquare size={20} />
          <span className="font-medium">Messagerie</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all">
          <Newspaper size={20} />
          <span className="font-medium">Actualités</span>
        </a>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};
