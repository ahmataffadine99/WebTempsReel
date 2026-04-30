import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma';

// Génère une room unique pour une paire d'utilisateurs (indépendante de l'ordre)
const getPairRoom = (id1: number, id2: number): string => {
  const [a, b] = [id1, id2].sort((x, y) => x - y);
  return `private_${a}_${b}`;
};

export const initChatSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Nouvelle connexion WebSocket : ${socket.id}`);

    // Rejoindre les rooms privées avec un autre utilisateur
    // Le client envoie ses partenaires de conversation (ex: conseillerId, directorId)
    socket.on('join_private', (payload: { myId: number; partnerId: number }) => {
      const roomName = getPairRoom(payload.myId, payload.partnerId);
      socket.join(roomName);
      console.log(`Room privée rejointe : ${roomName}`);
    });

    // Rejoindre la "room" du groupe des employés (Conseillers & Directeurs)
    socket.on('join_group_chat', (userRole: string) => {
      if (userRole === 'CONSEILLER' || userRole === 'DIRECTEUR') {
        socket.join('group_employes');
        console.log(`Employé (rôle: ${userRole}) a rejoint le chat de groupe`);
      }
    });

    // Recevoir un message privé et le transmettre
    socket.on('send_private_message', async (data: { senderId: number; receiverId: number; content: string }) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            senderId: data.senderId,
            receiverId: data.receiverId,
          },
          include: { sender: { select: { firstName: true, lastName: true, role: true } } }
        });

        // Envoi dans la room paire unique aux deux participants
        const roomName = getPairRoom(data.senderId, data.receiverId);
        io.to(roomName).emit('receive_private_message', message);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message privé:', error);
      }
    });

    // Recevoir un message de groupe et le transmettre
    socket.on('send_group_message', async (data: { senderId: number; content: string }) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            senderId: data.senderId,
            receiverId: null,
          },
          include: { sender: { select: { firstName: true, lastName: true, role: true } } }
        });

        io.to('group_employes').emit('receive_group_message', message);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message de groupe:', error);
      }
    });

    // BONUS : Indicateur "En train d'écrire"
    socket.on('typing', (data: { senderName: string; myId?: number; receiverId?: number; isGroup?: boolean }) => {
      if (data.isGroup) {
        socket.to('group_employes').emit('user_typing', { name: data.senderName, isGroup: true });
      } else if (data.myId && data.receiverId) {
        const roomName = getPairRoom(data.myId, data.receiverId);
        socket.to(roomName).emit('user_typing', { name: data.senderName, isGroup: false });
      }
    });

    socket.on('stop_typing', (data: { myId?: number; receiverId?: number; isGroup?: boolean }) => {
      if (data.isGroup) {
        socket.to('group_employes').emit('user_stop_typing', { isGroup: true });
      } else if (data.myId && data.receiverId) {
        const roomName = getPairRoom(data.myId, data.receiverId);
        socket.to(roomName).emit('user_stop_typing', { isGroup: false });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Déconnexion WebSocket : ${socket.id}`);
    });
  });
};
