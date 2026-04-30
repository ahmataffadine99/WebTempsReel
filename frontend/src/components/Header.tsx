import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, Search, User as UserIcon } from 'lucide-react';

export const Header = () => {
  const user = useAuthStore((state) => state.user);

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
        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          {/* Un petit point rouge pour de futures notifications */}
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-blue-400">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <UserIcon size={20} className="text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
};
