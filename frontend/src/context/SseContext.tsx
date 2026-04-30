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
  createdAt: string;
}

interface SseContextType {
  newsList: SseNews[];
  notifications: SseNotification[];
  unreadCount: number;
  markAllRead: () => void;
  deleteNews: (id: number) => void;
}

const SseContext = createContext<SseContextType>({
  newsList: [],
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  deleteNews: () => {},
});

export const useSse = () => useContext(SseContext);

export const SseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const [newsList, setNewsList] = useState<SseNews[]>([]);
  const [notifications, setNotifications] = useState<SseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAllRead = () => setUnreadCount(0);
  const deleteNews = (id: number) => setNewsList(prev => prev.filter(n => n.id !== id));

  useEffect(() => {
    if (!user) return;

    fetch('http://localhost:3000/sse/news')
      .then(res => res.json())
      .then(data => setNewsList(data))
      .catch(err => console.error(err));

    fetch(`http://localhost:3000/sse/notifications/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setNotifications(data);
        setUnreadCount(data.length);
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
    <SseContext.Provider value={{ newsList, notifications, unreadCount, markAllRead, deleteNews }}>
      {children}
    </SseContext.Provider>
  );
};
