import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSse } from '../context/SseContext';
import { useNav } from '../context/NavContext';
import { Bell, Search, User as UserIcon } from 'lucide-react';

export const Header = () => {
  const user = useAuthStore((state) => state.user);
  const { unreadCount, markAllRead } = useSse();
  const { setActiveSection } = useNav();

  const handleBellClick = () => {
    markAllRead();
    setActiveSection('dashboard'); // scroll vers la liste de notifs
  };

  return (
    <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">
      <div className="flex items-center bg-slate-800 rounded-xl px-4 py-2 border border-slate-700 w-96">
        <Search size={18} className="text-slate-500 mr-3" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="bg-transparent border-none text-sm text-white focus:outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-6">
        {/* Cloche avec badge */}
        <button
          onClick={handleBellClick}
          className="relative text-slate-400 hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 border border-slate-900 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
            <p className={`text-xs font-semibold ${
              user?.role === 'DIRECTEUR' ? 'text-amber-400' :
              user?.role === 'CONSEILLER' ? 'text-blue-400' : 'text-emerald-400'
            }`}>
              {user?.role === 'DIRECTEUR' ? 'Directeur' :
               user?.role === 'CONSEILLER' ? 'Conseiller' : 'Client'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <UserIcon size={20} className="text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
};
