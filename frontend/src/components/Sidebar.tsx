import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNav } from '../context/NavContext';
import { Building2, Home, MessageSquare, Newspaper, LogOut } from 'lucide-react';

export const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);
  const { activeSection, setActiveSection } = useNav();

  const navItems = [
    { id: 'dashboard' as const, label: 'Tableau de bord', icon: Home },
    { id: 'messages' as const, label: 'Messagerie', icon: MessageSquare },
    { id: 'news' as const, label: 'Actualites', icon: Newspaper },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
          <Building2 size={24} className="text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          AVENIR
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              activeSection === id
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Deconnexion</span>
        </button>
      </div>
    </div>
  );
};
