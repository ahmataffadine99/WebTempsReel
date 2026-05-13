import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { NewsFeed } from '../components/NewsFeed';
import { NotificationList } from '../components/NotificationList';
import { Chat } from '../components/Chat';
import { AdminPanel } from '../components/AdminPanel';
import { SseProvider } from '../context/SseContext';
import { NavProvider, useNav } from '../context/NavContext';

const DashboardContent = () => {
  const { user } = useAuthStore();
  const { activeSection } = useNav();

  return (
    <div className="flex h-screen bg-slate-950 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />

        <main className="flex-1 overflow-hidden bg-slate-950">

          <div className="lg:hidden h-full p-3 sm:p-4">
            {activeSection === 'news' && <NewsFeed />}
            {activeSection === 'messages' && <Chat />}
            {activeSection === 'dashboard' && (
              user?.role === 'CLIENT' ? <NotificationList /> : <AdminPanel />
            )}
          </div>

          {/* Desktop (lg+) : grille 3 colonnes */}
          <div className="hidden lg:grid grid-cols-12 gap-6 h-full p-6">

            <div className={`col-span-3 ${
              activeSection === 'messages' ? 'hidden' : ''
            }`}>
              <NewsFeed />
            </div>

            <div className={`${
              activeSection === 'news' ? 'hidden' :
              activeSection === 'messages' ? 'col-span-12' :
              'col-span-6'
            }`}>
              <Chat />
            </div>

            <div className={`col-span-3 ${
              activeSection === 'messages' ? 'hidden' : ''
            }`}>
              {user?.role === 'CLIENT' ? <NotificationList /> : <AdminPanel />}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <NavProvider>
      <SseProvider>
        <DashboardContent />
      </SseProvider>
    </NavProvider>
  );
};