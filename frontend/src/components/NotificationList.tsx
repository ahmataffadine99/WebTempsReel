import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Bell } from 'lucide-react';

interface AppNotification {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationList = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const user = useAuthStore((state) => state.user);

  // Demande de permission pour les notifications Web Push au chargement
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Connexion SSE
    const eventSource = new EventSource(`http://localhost:3000/sse/stream?userId=${user.id}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'NEW_NOTIFICATION') {
        const newNotif = data.payload as AppNotification;
        setNotifications((prev) => [newNotif, ...prev]);

        // BONUS: API Web Notification Push
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Banque AVENIR', {
            body: newNotif.content,
            icon: '/vite.svg', // Optionnel : tu peux mettre un chemin vers une vraie icône
          });
        }
      }
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="bg-slate-800/50 p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell size={20} className="text-purple-400" />
          Notifications
          {notifications.length > 0 && (
            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
              {notifications.length}
            </span>
          )}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {notifications.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">Aucune notification.</p>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-3 rounded-xl border ${
                notif.isRead 
                  ? 'bg-slate-800/30 border-slate-800/50' 
                  : 'bg-purple-900/20 border-purple-800/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
              }`}
            >
              <p className={`text-sm ${notif.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                {notif.content}
              </p>
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
