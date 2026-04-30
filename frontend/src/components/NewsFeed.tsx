import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSse } from '../context/SseContext';
import { Megaphone, Clock, Trash2 } from 'lucide-react';

export const NewsFeed = () => {
  const user = useAuthStore((state) => state.user);
  const { newsList, deleteNews } = useSse();

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette actualité ?')) return;
    try {
      await fetch(`http://localhost:3000/sse/news/${id}`, { method: 'DELETE' });
      deleteNews(id); // Mise à jour locale immédiate
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center gap-2">
        <Megaphone size={20} className="text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Actualités</h2>
        {newsList.length > 0 && (
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
            {newsList.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {newsList.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">Aucune actualité récente.</div>
        ) : (
          newsList.map((news) => (
            <div key={news.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors group relative">
              {/* Bouton suppression pour Directeur */}
              {user?.role === 'DIRECTEUR' && (
                <button
                  onClick={() => handleDelete(news.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <h3 className="font-medium text-white mb-1 pr-6">{news.title}</h3>
              <p className="text-slate-400 text-sm mb-3">{news.content}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={12} />
                <span>
                  {new Date(news.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                {news.author && (
                  <span className="ml-auto text-blue-400/80">
                    Par {news.author.firstName} {news.author.lastName}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
