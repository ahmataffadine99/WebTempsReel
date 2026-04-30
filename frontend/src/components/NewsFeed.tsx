import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Megaphone, Clock } from 'lucide-react';

interface News {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author?: { firstName: string; lastName: string };
}

export const NewsFeed = () => {
  const user = useAuthStore((state) => state.user);
  const [newsList, setNewsList] = useState<News[]>([]);

  useEffect(() => {
    if (!user) return;

    // Connexion SSE
    const eventSource = new EventSource(`http://localhost:3000/sse/stream?userId=${user.id}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'NEW_NEWS') {
        // Ajouter la nouvelle actualité en haut de la liste
        setNewsList((prev) => [data.payload, ...prev]);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Erreur SSE News:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
        <Megaphone size={20} className="text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Actualités</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {newsList.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">Aucune actualité récente</div>
        ) : (
          newsList.map((news) => (
            <div key={news.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <h3 className="font-medium text-white mb-1">{news.title}</h3>
              <p className="text-slate-400 text-sm mb-3">{news.content}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={12} />
                <span>
                  {new Date(news.createdAt).toLocaleDateString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
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
