import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { BellRing, CheckCircle2 } from 'lucide-react';

interface Notification {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationList = () => {
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Nous partageons le même point d'accès SSE que les News
    // Dans une vraie app, on pourrait optimiser pour avoir un seul EventSource
    // partagé via un Context, mais pour la démo, ça fonctionne très bien.
    const eventSource = new EventSource(`http://localhost:3000/sse/stream?userId=${user.id}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'NEW_NOTIFICATION') {
        // Ajouter la nouvelle notification en haut
        setNotifications((prev) => [data.payload, ...prev]);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
        <BellRing size={20} className="text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Notifications</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">Aucune notification</div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="bg-emerald-900/10 p-3 rounded-xl border border-emerald-500/20 flex gap-3">
              <div className="mt-0.5">
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-300 text-sm">{notif.content}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(notif.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
