import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSse } from '../context/SseContext';
import { useNav } from '../context/NavContext';
import { Bell, Search, User as UserIcon, Menu } from 'lucide-react';

export const Header = () => {
  const user = useAuthStore((state) => state.user);
  const { unreadCount, markAllRead } = useSse();
  const { setActiveSection, toggleSidebar } = useNav();

  const handleBellClick = () => {
    markAllRead();
    setActiveSection('dashboard');
  };

  return (
    <header className="h-14 sm:h-16 lg:h-20 bg-slate-900 border-b border-slate-800 flex items-center gap-3 px-4 lg:px-8 flex-shrink-0">
      <button
        onClick={toggleSidebar}
        className="lg:hidden text-slate-400 hover:text-white transition-colors flex-shrink-0"
        aria-label="Menu"
      >
        <Menu size={22} />
      </button>

      <div className="hidden sm:flex items-center bg-slate-800 rounded-xl px-4 py-2 border border-slate-700 flex-1 max-w-xs lg:max-w-md">
        <Search size={18} className="text-slate-500 mr-3 flex-shrink-0" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="bg-transparent border-none text-sm text-white focus:outline-none w-full"
        />
      </div>

      {/* Icône recherche sur mobile */}
      <button className="sm:hidden text-slate-400 hover:text-white transition-colors">
        <Search size={20} />
      </button>

      <div className="flex items-center gap-3 lg:gap-6 ml-auto">
        {/* Cloche */}
        <button
          onClick={handleBellClick}
          className="relative text-slate-400 hover:text-white transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 border border-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 lg:gap-3 border-l border-slate-800 pl-3 lg:pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className={`text-xs font-semibold ${
              user?.role === 'DIRECTEUR' ? 'text-amber-400' :
              user?.role === 'CONSEILLER' ? 'text-blue-400' : 'text-emerald-400'
            }`}>
              {user?.role === 'DIRECTEUR' ? 'Directeur' :
               user?.role === 'CONSEILLER' ? 'Conseiller' : 'Client'}
            </p>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0">
            <UserIcon size={18} className="text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
};