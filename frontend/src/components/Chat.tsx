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

export const Chat = () => {
  const user = useAuthStore((state) => state.user);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const [chatType, setChatType] = useState<'PRIVATE' | 'GROUP'>('PRIVATE');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Récupérer la liste des utilisateurs pour trouver les vrais IDs
  useEffect(() => {
    fetch('http://localhost:3000/auth/users')
      .then(res => res.json())
      .then(data => {
        setContacts(data);
        // Si c'est un employé, sélectionner le premier client par défaut
        if (user && user.role !== 'CLIENT') {
          const clients = data.filter((c: any) => c.role === 'CLIENT');
          if (clients.length > 0) setSelectedClientId(clients[0].id);
        }
      })
      .catch(err => console.error(err));
  }, [user]);

  const getReceiverId = () => {
    if (!user) return undefined;
    if (user.role === 'CLIENT') {
      const conseiller = contacts.find(c => c.role === 'CONSEILLER');
      return conseiller?.id;
    } else {
      // Pour les employés, on renvoie le client actuellement sélectionné
      return selectedClientId || undefined;
    }
  };

  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Le client (ou l'employé) rejoint sa propre room personnelle
      newSocket.emit('join_private', user.id);
      
      // Si c'est un employé, il rejoint le chat de groupe
      if (user.role === 'CONSEILLER' || user.role === 'DIRECTEUR') {
        newSocket.emit('join_group_chat', user.role);
      }
      
      // Le conseiller et directeur doivent écouter tous les clients
      if (user.role !== 'CLIENT') {
         const clients = contacts.filter(c => c.role === 'CLIENT');
         clients.forEach(client => newSocket.emit('join_private', client.id));
      }
    });

    // Réception des messages
    newSocket.on('receive_private_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('receive_group_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Bonus : Indicateur de frappe
    newSocket.on('user_typing', ({ name, isGroup }) => {
      if ((isGroup && chatType === 'GROUP') || (!isGroup && chatType === 'PRIVATE')) {
        setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
      }
    });

    newSocket.on('user_stop_typing', ({ isGroup }) => {
      setTypingUsers([]); 
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, chatType, contacts]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // On enlève le forçage sur l'onglet GROUPE pour le directeur car il a maintenant le droit d'écrire en privé
  useEffect(() => {
    // Si l'admin se connecte, il peut rester sur l'onglet par défaut (PRIVATE ou GROUP)
  }, [user]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);

    if (socket && user) {
      const receiverId = getReceiverId();

      socket.emit('typing', {
        senderName: `${user.firstName}`,
        receiverId: chatType === 'PRIVATE' ? receiverId : undefined,
        isGroup: chatType === 'GROUP'
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          receiverId: chatType === 'PRIVATE' ? receiverId : undefined,
          isGroup: chatType === 'GROUP'
        });
      }, 1000);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !socket || !user) return;

    if (chatType === 'PRIVATE') {
      const receiverId = getReceiverId();
      if (!receiverId) return; // Si on n'a pas trouvé le destinataire

      socket.emit('send_private_message', {
        senderId: user.id,
        receiverId,
        content: currentMessage,
      });
    } else {
      socket.emit('send_group_message', {
        senderId: user.id,
        content: currentMessage,
      });
    }

    setCurrentMessage('');
  };

  // Filtrer les messages à afficher selon l'onglet ET le client sélectionné
  const displayedMessages = messages.filter(m => {
    if (chatType === 'GROUP') {
      return m.receiverId === null; // Messages de groupe
    } else {
      if (m.receiverId === null) return false; // Ignorer les messages de groupe
      
      // Si on est client, on voit tout notre historique privé
      if (user?.role === 'CLIENT') return true;
      
      // Si on est employé, on ne voit que les messages échangés avec le client SÉLECTIONNÉ
      return m.senderId === selectedClientId || m.receiverId === selectedClientId;
    }
  });

  const clientContacts = contacts.filter(c => c.role === 'CLIENT');

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Header du Chat */}
      <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Messagerie</h2>
        </div>
        
        {/* Onglets (visible uniquement pour les employés) */}
        {user?.role !== 'CLIENT' && (
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setChatType('PRIVATE')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                chatType === 'PRIVATE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User size={14} /> Privé
            </button>
            <button
              onClick={() => setChatType('GROUP')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                chatType === 'GROUP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={14} /> Groupe (Admin)
            </button>
          </div>
        )}
      </div>

      {/* Zone principale (Contacts + Messages) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Barre latérale des contacts (uniquement pour employés en mode privé) */}
        {user?.role !== 'CLIENT' && chatType === 'PRIVATE' && (
          <div className="w-48 bg-slate-950 border-r border-slate-800 flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Clients
            </div>
            {clientContacts.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                className={`w-full text-left p-3 text-sm transition-colors border-l-2 ${
                  selectedClientId === c.id 
                    ? 'bg-blue-900/20 border-blue-500 text-blue-400' 
                    : 'border-transparent text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium truncate">{c.firstName} {c.lastName}</div>
              </button>
            ))}
            {clientContacts.length === 0 && (
              <div className="p-3 text-xs text-slate-500 italic">Aucun client.</div>
            )}
          </div>
        )}

        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900">
        {displayedMessages.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">
            Envoyez un message pour commencer la discussion.
          </div>
        ) : (
          displayedMessages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            const isDirector = msg.sender.role === 'DIRECTEUR';
            
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : isDirector 
                        ? 'bg-amber-600/20 text-amber-100 border border-amber-600/30 rounded-bl-none' // Distinction visuelle du directeur
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}
                >
                  {!isMe && (
                    <p className={`text-xs font-medium mb-1 ${isDirector ? 'text-amber-400' : 'text-slate-400'}`}>
                      {msg.sender.firstName} {isDirector && '(Directeur)'}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        
        {/* Indicateur de frappe */}
        {typingUsers.length > 0 && (
          <div className="text-slate-500 text-xs italic ml-2">
            En train d'écrire...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <form onSubmit={sendMessage} className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-full p-1 pl-4">
          <input
            type="text"
            value={currentMessage}
            onChange={handleTyping}
            placeholder={
              chatType === 'PRIVATE' && user?.role !== 'CLIENT' && !selectedClientId 
                ? "Sélectionnez un client..." 
                : "Écrivez votre message..."
            }
            disabled={chatType === 'PRIVATE' && user?.role !== 'CLIENT' && !selectedClientId}
            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!currentMessage.trim() || (chatType === 'PRIVATE' && user?.role !== 'CLIENT' && !selectedClientId)}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send size={16} className="ml-1" />
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
