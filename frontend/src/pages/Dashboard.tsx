import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { NewsFeed } from '../components/NewsFeed';
import { NotificationList } from '../components/NotificationList';

export const Dashboard = () => {
  const { isAuthenticated } = useAuthStore();

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
            <div className="col-span-6 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col h-[calc(100vh-8rem)]">
              <h2 className="text-lg font-semibold text-white mb-4">Messages</h2>
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                En attente de connexion WebSockets...
              </div>
            </div>

            {/* Zone pour les Notifications (SSE) */}
            <div className="col-span-3 h-[calc(100vh-8rem)]">
              <NotificationList />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
