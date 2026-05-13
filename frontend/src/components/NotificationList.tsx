import React from 'react';
import { useSse } from '../context/SseContext';
import { useNav } from '../context/NavContext';
import { Bell, Trash2, CheckCheck } from 'lucide-react';

export const NotificationList = () => {
  const { notifications, unreadCount, markAllRead, markAsRead, deleteNotification } = useSse();
  const { setActiveSection } = useNav();

  const handleOpen = () => {
    markAllRead();
    setActiveSection('dashboard');
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center gap-2">
        <Bell size={20} className="text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Notifications</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
        {unreadCount > 0 && (
          <button
            onClick={handleOpen}
            title="Tout marquer comme lu"
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-purple-400 transition-colors"
          >
            <CheckCheck size={14} />
            <span className="hidden sm:inline">Tout lire</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {notifications.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">Aucune notification.</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`group relative border p-3 rounded-xl transition-colors ${
                notif.isRead
                  ? 'bg-slate-800/30 border-slate-700/50'
                  : 'bg-purple-900/20 border-purple-800/50'
              }`}
            >
              {!notif.isRead && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-purple-500 rounded-full" />
              )}
              <p className="text-sm text-slate-200 pr-6">{notif.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">
                  {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: '2-digit'
                  })}{' '}
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      title="Marquer comme lu"
                      className="text-slate-500 hover:text-purple-400 transition-colors"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    title="Supprimer"
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};