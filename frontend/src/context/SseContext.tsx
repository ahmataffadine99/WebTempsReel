import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export interface SseNews {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: string;
  author?: { firstName: string; lastName: string };
}

export interface SseNotification {
  id: number;
  content: string;
  userId: number;
  isRead: boolean;
  createdAt: string;
}

interface SseContextType {
  newsList: SseNews[];
  notifications: SseNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (id: number) => void;
  deleteNews: (id: number) => void;
  deleteNotification: (id: number) => void;
}

const SseContext = createContext<SseContextType>({
  newsList: [],
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markAsRead: () => {},
  deleteNews: () => {},
  deleteNotification: () => {},
});

export const useSse = () => useContext(SseContext);

export const SseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const [newsList, setNewsList] = useState<SseNews[]>([]);
  const [notifications, setNotifications] = useState<SseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await Promise.all(
      unread.map(n =>
        fetch(`http://localhost:3000/sse/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {})
      )
    );
  };

  const markAsRead = async (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    await fetch(`http://localhost:3000/sse/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
  };

  const deleteNews = (id: number) => setNewsList(prev => prev.filter(n => n.id !== id));

  const deleteNotification = async (id: number) => {
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    await fetch(`http://localhost:3000/sse/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;

    fetch('http://localhost:3000/sse/news')
      .then(res => res.json())
      .then(data => setNewsList(data))
      .catch(err => console.error(err));

    fetch(`http://localhost:3000/sse/notifications/${user.id}`)
      .then(res => res.json())
      .then((data: SseNotification[]) => {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      })
      .catch(err => console.error(err));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const eventSource = new EventSource(`http://localhost:3000/sse/stream?userId=${user.id}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'NEW_NEWS') {
        setNewsList(prev => {
          if (prev.find(n => n.id === data.payload.id)) return prev;
          return [data.payload as SseNews, ...prev];
        });
      }

      if (data.type === 'DELETE_NEWS') {
        setNewsList(prev => prev.filter(n => n.id !== data.payload.id));
      }

      if (data.type === 'NEW_NOTIFICATION') {
        const notif = data.payload as SseNotification;
        setNotifications(prev => {
          if (prev.find(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        setUnreadCount(prev => prev + 1);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Banque AVENIR', { body: notif.content, icon: '/vite.svg' });
        }
      }
    };

    eventSource.onerror = () => { eventSource.close(); };

    return () => { eventSource.close(); };
  }, [user]);

  return (
    <SseContext.Provider value={{ newsList, notifications, unreadCount, markAllRead, markAsRead, deleteNews, deleteNotification }}>
      {children}
    </SseContext.Provider>
  );
};