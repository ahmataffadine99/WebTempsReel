import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { NewsFeed } from '../components/NewsFeed';
import { NotificationList } from '../components/NotificationList';
import { Chat } from '../components/Chat';
import { AdminPanel } from '../components/AdminPanel';

export const Dashboard = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-6">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Zone pour le Flux d'actualités (SSE) */}
            <div className="col-span-3 h-[calc(100vh-8rem)]">
              <NewsFeed />
            </div>

            {/* Zone pour le Chat (WebSockets) */}
            <div className="col-span-6 h-[calc(100vh-8rem)]">
              <Chat />
            </div>

            {/* Zone pour les Notifications ou le Panneau d'administration */}
            <div className="col-span-3 h-[calc(100vh-8rem)]">
              {user?.role === 'CLIENT' ? <NotificationList /> : <AdminPanel />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
