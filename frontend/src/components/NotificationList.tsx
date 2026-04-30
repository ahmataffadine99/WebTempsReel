import React from 'react';
import { useSse } from '../context/SseContext';
import { useNav } from '../context/NavContext';
import { Bell } from 'lucide-react';

export const NotificationList = () => {
  const { notifications, unreadCount, markAllRead } = useSse();
  const { setActiveSection } = useNav();

  const handleOpen = () => {
    markAllRead();
    setActiveSection('dashboard');
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      <div
        className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center gap-2 cursor-pointer"
        onClick={handleOpen}
      >
        <Bell size={20} className="text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Notifications</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
            {unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {notifications.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">Aucune notification.</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-purple-900/20 border border-purple-800/50 p-3 rounded-xl"
            >
              <p className="text-sm text-slate-200">{notif.content}</p>
              <span className="text-xs text-slate-500 mt-2 block">
                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
