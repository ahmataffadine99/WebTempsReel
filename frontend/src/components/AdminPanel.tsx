import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSse } from '../context/SseContext';
import { Send, Megaphone, Bell, UserPlus, ChevronDown } from 'lucide-react';

export const AdminPanel = () => {
  const user = useAuthStore((state) => state.user);
  const { notifications, unreadCount, markAllRead } = useSse();

  const [activeTab, setActiveTab] = useState<'notifs' | 'news' | 'employee'>('notifs');

  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');

  const [notifContent, setNotifContent] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Création d'employé
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empFirstName, setEmpFirstName] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empRole, setEmpRole] = useState('CONSEILLER');
  const [empSuccess, setEmpSuccess] = useState('');
  const [empError, setEmpError] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/auth/users')
      .then(res => res.json())
      .then(data => setAllUsers(data.filter((u: any) => u.id !== user?.id)))
      .catch(err => console.error(err));
  }, [user]);

  if (!user || user.role === 'CLIENT') return null;

  const handlePublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:3000/sse/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newsTitle, content: newsContent, authorId: user.id }),
      });
      setNewsTitle(''); setNewsContent('');
      alert('Actualité publiée !');
    } catch { alert('Erreur'); }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:3000/sse/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notifContent, userId: parseInt(selectedUserId) }),
      });
      setNotifContent(''); setSelectedUserId('');
      alert('Notification envoyée !');
    } catch { alert('Erreur'); }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError(''); setEmpSuccess('');
    try {
      const res = await fetch('http://localhost:3000/auth/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: empEmail, password: empPassword, firstName: empFirstName, lastName: empLastName, role: empRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmpSuccess(`Compte créé pour ${empFirstName} ${empLastName} (${empRole})`);
      setEmpEmail(''); setEmpPassword(''); setEmpFirstName(''); setEmpLastName('');
      // Rafraîchir la liste des utilisateurs
      const users = await fetch('http://localhost:3000/auth/users').then(r => r.json());
      setAllUsers(users.filter((u: any) => u.id !== user?.id));
    } catch (err: any) {
      setEmpError(err.message || 'Erreur lors de la création');
    }
  };

  const getRoleLabel = (role: string) => ({ CLIENT: 'Client', CONSEILLER: 'Conseiller', DIRECTEUR: 'Directeur' }[role] || role);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Onglets */}
      <div className="bg-slate-800/50 border-b border-slate-800 flex">
        <button
          onClick={() => { setActiveTab('notifs'); markAllRead(); }}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'notifs' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell size={14} />
          Notifs
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'news' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone size={14} /> Actualités
        </button>
        {/* Seulement le Directeur peut créer des employés */}
        {user.role === 'DIRECTEUR' && (
          <button
            onClick={() => setActiveTab('employee')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'employee' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus size={14} /> Équipe
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

        {/* Onglet Notifications */}
        {activeTab === 'notifs' && (
          <div className="space-y-4">
            {/* Formulaire d'envoi */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Send size={12} className="text-purple-400" /> Envoyer une notification
              </h3>
              <form onSubmit={handleSendNotification} className="space-y-2">
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Destinataire...</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} — {getRoleLabel(u.role)}
                    </option>
                  ))}
                </select>
                <textarea
                  value={notifContent}
                  onChange={e => setNotifContent(e.target.value)}
                  placeholder="Message..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 resize-none"
                  required
                />
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Send size={12} /> Envoyer
                </button>
              </form>
            </div>
            {/* Liste des notifications reçues */}
            <div>
              <p className="text-xs text-slate-500 mb-2">Mes notifications reçues :</p>
              {notifications.length === 0 ? (
                <p className="text-slate-600 text-xs italic">Aucune.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="bg-purple-900/20 border border-purple-800/50 p-3 rounded-xl mb-2">
                    <p className="text-xs text-slate-200">{n.content}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Onglet Actualités */}
        {activeTab === 'news' && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Megaphone size={12} className="text-blue-400" /> Publier une Actualité
            </h3>
            <form onSubmit={handlePublishNews} className="space-y-2">
              <input
                type="text"
                value={newsTitle}
                onChange={e => setNewsTitle(e.target.value)}
                placeholder="Titre"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                required
              />
              <textarea
                value={newsContent}
                onChange={e => setNewsContent(e.target.value)}
                placeholder="Contenu..."
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                required
              />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                <Send size={12} /> Publier pour tous les clients
              </button>
            </form>
          </div>
        )}

        {/* Onglet Équipe (Directeur seulement) */}
        {activeTab === 'employee' && user.role === 'DIRECTEUR' && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <UserPlus size={12} className="text-amber-400" /> Créer un compte employé
            </h3>
            {empError && <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-xs p-2 rounded-lg mb-3">{empError}</div>}
            {empSuccess && <div className="bg-green-900/30 border border-green-700/50 text-green-400 text-xs p-2 rounded-lg mb-3">✓ {empSuccess}</div>}
            <form onSubmit={handleCreateEmployee} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={empFirstName} onChange={e => setEmpFirstName(e.target.value)} placeholder="Prénom" className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500" required />
                <input type="text" value={empLastName} onChange={e => setEmpLastName(e.target.value)} placeholder="Nom" className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500" required />
              </div>
              <input type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500" required />
              <input type="password" value={empPassword} onChange={e => setEmpPassword(e.target.value)} placeholder="Mot de passe" className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500" required />
              <select value={empRole} onChange={e => setEmpRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500">
                <option value="CONSEILLER">Conseiller</option>
                <option value="DIRECTEUR">Directeur</option>
              </select>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                <UserPlus size={12} /> Créer le compte
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
