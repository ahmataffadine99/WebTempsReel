import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Megaphone, Bell } from 'lucide-react';

export const AdminPanel = () => {
  const user = useAuthStore((state) => state.user);
  
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  
  const [notifContent, setNotifContent] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/auth/users')
      .then(res => res.json())
      .then(data => {
        // On ne liste que les clients pour les notifications
        setClients(data.filter((u: any) => u.role === 'CLIENT'));
      })
      .catch(err => console.error(err));
  }, []);

  if (!user || user.role === 'CLIENT') return null;

  const handlePublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsContent) return;

    try {
      await fetch('http://localhost:3000/sse/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsTitle,
          content: newsContent,
          authorId: user.id
        })
      });
      setNewsTitle('');
      setNewsContent('');
      alert('Actualité publiée avec succès !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la publication');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifContent || !selectedClient) return;

    try {
      await fetch('http://localhost:3000/sse/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: notifContent,
          userId: parseInt(selectedClient)
        })
      });
      setNotifContent('');
      setSelectedClient('');
      alert('Notification envoyée avec succès !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'envoi de la notification');
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="bg-slate-800/50 p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Megaphone size={20} className="text-amber-400" />
          Panneau d'Administration
        </h2>
      </div>
      
      <div className="p-4 overflow-y-auto space-y-8 custom-scrollbar">
        
        {/* Section Actualités */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <h3 className="text-md font-medium text-slate-200 mb-4 flex items-center gap-2">
            <Megaphone size={16} className="text-blue-400" />
            Publier une Actualité
          </h3>
          <form onSubmit={handlePublishNews} className="space-y-3">
            <input
              type="text"
              value={newsTitle}
              onChange={(e) => setNewsTitle(e.target.value)}
              placeholder="Titre de l'actualité"
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
            <textarea
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="Contenu..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send size={14} /> Publier pour tous les clients
            </button>
          </form>
        </div>

        {/* Section Notifications */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <h3 className="text-md font-medium text-slate-200 mb-4 flex items-center gap-2">
            <Bell size={16} className="text-purple-400" />
            Envoyer une Notification
          </h3>
          <form onSubmit={handleSendNotification} className="space-y-3">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"
              required
            >
              <option value="">Sélectionner un client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
            <textarea
              value={notifContent}
              onChange={(e) => setNotifContent(e.target.value)}
              placeholder="Message de notification..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send size={14} /> Envoyer la notification
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
