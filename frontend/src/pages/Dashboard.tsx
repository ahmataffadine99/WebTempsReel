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

// Composant interne qui utilise le NavContext
const DashboardContent = () => {
  const { user } = useAuthStore();
  const { activeSection } = useNav();

  // Gestion de la visibilité des sections selon l'onglet actif dans le sidebar
  const isVisible = (section: string) => {
    if (activeSection === 'dashboard') return true; // Tout visible par défaut
    return activeSection === section;
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-6">
          <div className="grid grid-cols-12 gap-6 h-full">

            {/* Colonne gauche : Actualités (visible par clients et en mode dashboard) */}
            <div className={`col-span-3 h-[calc(100vh-8rem)] transition-all ${
              activeSection === 'messages' ? 'hidden' : 'block'
            }`}>
              <NewsFeed />
            </div>

            {/* Colonne centrale : Chat / Messagerie */}
            <div className={`h-[calc(100vh-8rem)] transition-all ${
              activeSection === 'news' ? 'hidden' :
              activeSection === 'messages' ? 'col-span-12' :
              'col-span-6'
            }`}>
              <Chat />
            </div>

            {/* Colonne droite : Notifications (client) ou Panneau Admin (employés) */}
            <div className={`col-span-3 h-[calc(100vh-8rem)] transition-all ${
              activeSection === 'messages' ? 'hidden' : 'block'
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
