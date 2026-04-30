import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Users, User, MessageSquare } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number | null;
  createdAt: string;
  sender: { firstName: string; lastName: string; role: string };
}

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  CONSEILLER: 'Conseiller',
  DIRECTEUR: 'Directeur',
};

const ROLE_COLORS: Record<string, string> = {
  CLIENT: 'text-emerald-400',
  CONSEILLER: 'text-blue-400',
  DIRECTEUR: 'text-amber-400',
};

export const Chat = () => {
  const user = useAuthStore((state) => state.user);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  const [chatType, setChatType] = useState<'PRIVATE' | 'GROUP'>('PRIVATE');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Charger la liste des contacts (avec polling toutes les 10s pour les nouveaux inscrits)
  useEffect(() => {
    if (!user) return;

    const fetchContacts = () => {
      fetch('http://localhost:3000/auth/users')
        .then(res => res.json())
        .then(data => {
          setContacts(data);
          // Sélection par défaut si pas encore sélectionné
          setSelectedPartnerId(prev => {
            if (prev !== null) return prev; // déjà sélectionné
            if (user.role === 'CLIENT') {
              const emp = data.find((c: Contact) => c.role === 'CONSEILLER');
              return emp?.id ?? null;
            } else {
              const client = data.find((c: Contact) => c.role === 'CLIENT' && c.id !== user.id);
              return client?.id ?? null;
            }
          });
        })
        .catch(err => console.error(err));
    };

    fetchContacts();
    const interval = setInterval(fetchContacts, 10000); // Rafraîchissement toutes les 10s
    return () => clearInterval(interval);
  }, [user]);

  // Connexion Socket.io
  useEffect(() => {
    if (!user || contacts.length === 0) return;

    // Éviter de créer une nouvelle socket si elle existe déjà
    if (socketRef.current) return;

    const newSocket = io('http://localhost:3000');
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Rejoindre la room paire avec tous les autres utilisateurs
      const others = contacts.filter(c => c.id !== user.id);
      others.forEach(partner => {
        newSocket.emit('join_private', { myId: user.id, partnerId: partner.id });
      });
      // Rejoindre le chat de groupe si employé
      if (user.role === 'CONSEILLER' || user.role === 'DIRECTEUR') {
        newSocket.emit('join_group_chat', user.role);
      }
    });

    newSocket.on('receive_private_message', (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev; // éviter doublon
        return [...prev, msg];
      });
    });

    newSocket.on('receive_group_message', (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    newSocket.on('user_typing', ({ name, isGroup }: { name: string; isGroup: boolean }) => {
      setTypingUsers(prev => prev.includes(name) ? prev : [...prev, name]);
    });

    newSocket.on('user_stop_typing', () => { setTypingUsers([]); });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user, contacts.length > 0]);

  // Charger l'historique des messages quand on change de partenaire ou de mode
  useEffect(() => {
    if (!user) return;

    if (chatType === 'GROUP') {
      fetch('http://localhost:3000/messages/group')
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error(err));
    } else if (selectedPartnerId) {
      fetch(`http://localhost:3000/messages/private/${user.id}/${selectedPartnerId}`)
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error(err));
    }
  }, [chatType, selectedPartnerId, user]);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
    if (socket && user && selectedPartnerId) {
      socket.emit('typing', {
        senderName: user.firstName,
        myId: user.id,
        receiverId: chatType === 'PRIVATE' ? selectedPartnerId : undefined,
        isGroup: chatType === 'GROUP',
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          myId: user.id,
          receiverId: chatType === 'PRIVATE' ? selectedPartnerId : undefined,
          isGroup: chatType === 'GROUP',
        });
      }, 1000);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !socket || !user) return;

    if (chatType === 'PRIVATE') {
      if (!selectedPartnerId) return;
      socket.emit('send_private_message', {
        senderId: user.id,
        receiverId: selectedPartnerId,
        content: currentMessage,
      });
    } else {
      socket.emit('send_group_message', { senderId: user.id, content: currentMessage });
    }
    setCurrentMessage('');
  };

  // Contacts selon le rôle
  const privateContacts: Contact[] = user?.role === 'CLIENT'
    ? contacts.filter(c => c.role === 'CONSEILLER' || c.role === 'DIRECTEUR') // Client voit tous les employés
    : contacts.filter(c => c.id !== user?.id); // Employés voient tout le monde

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Messagerie</h2>
        </div>

        {/* Onglets uniquement pour les employés */}
        {user?.role !== 'CLIENT' && (
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setChatType('PRIVATE')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                chatType === 'PRIVATE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User size={14} /> Privé
            </button>
            <button
              onClick={() => setChatType('GROUP')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                chatType === 'GROUP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={14} /> Groupe
            </button>
          </div>
        )}
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar contacts (toujours visible en mode Privé) */}
        {chatType === 'PRIVATE' && (
          <div className="w-44 bg-slate-950 border-r border-slate-800 flex flex-col overflow-y-auto flex-shrink-0">
            <div className="p-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {user?.role === 'CLIENT' ? 'Mon Conseiller' : 'Contacts'}
            </div>
            {privateContacts.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 italic">Aucun contact.</div>
            ) : (
              privateContacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedPartnerId(c.id)}
                  className={`w-full text-left p-3 text-sm transition-colors border-l-2 ${
                    selectedPartnerId === c.id
                      ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-medium truncate">{c.firstName} {c.lastName}</div>
                  <div className={`text-xs ${ROLE_COLORS[c.role] || 'text-slate-500'}`}>
                    {ROLE_LABELS[c.role] || c.role}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900">
          {messages.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8">
              {chatType === 'PRIVATE' && !selectedPartnerId
                ? 'Sélectionnez un contact.'
                : 'Aucun message pour l\'instant.'}
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === user?.id;
              const roleColor = ROLE_COLORS[msg.sender.role] || 'text-slate-400';
              const roleLabel = ROLE_LABELS[msg.sender.role] || msg.sender.role;

              return (
                <div key={msg.id ?? idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : msg.sender.role === 'DIRECTEUR'
                        ? 'bg-amber-600/20 text-amber-100 border border-amber-600/30 rounded-bl-none'
                        : msg.sender.role === 'CONSEILLER'
                          ? 'bg-blue-900/30 text-blue-100 border border-blue-700/30 rounded-bl-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}>
                    {!isMe && (
                      <p className={`text-xs font-semibold mb-1 ${roleColor}`}>
                        {msg.sender.firstName} · {roleLabel}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[10px] mt-1 opacity-50">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {typingUsers.length > 0 && (
            <div className="text-slate-500 text-xs italic ml-2">
              {typingUsers.join(', ')} est en train d'écrire...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Zone de saisie */}
      <form onSubmit={sendMessage} className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-full p-1 pl-4">
          <input
            type="text"
            value={currentMessage}
            onChange={handleTyping}
            placeholder={
              chatType === 'PRIVATE' && !selectedPartnerId
                ? 'Sélectionnez un contact...'
                : 'Écrivez votre message...'
            }
            disabled={chatType === 'PRIVATE' && !selectedPartnerId}
            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!currentMessage.trim() || (chatType === 'PRIVATE' && !selectedPartnerId)}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
