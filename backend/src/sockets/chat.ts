import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma';

export const initChatSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Nouvelle connexion WebSocket : ${socket.id}`);

    // Rejoindre une "room" personnelle pour recevoir des messages privés
    socket.on('join_private', (userId: number) => {
      const roomName = `user_${userId}`;
      socket.join(roomName);
      console.log(`L'utilisateur ${userId} a rejoint la room privée ${roomName}`);
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
        // Sauvegarde en BDD
        const message = await prisma.message.create({
          data: {
            content: data.content,
            senderId: data.senderId,
            receiverId: data.receiverId,
          },
          include: { sender: { select: { firstName: true, lastName: true, role: true } } }
        });

        // Envoi au destinataire ET à l'expéditeur (pour mettre à jour son UI)
        io.to(`user_${data.receiverId}`).to(`user_${data.senderId}`).emit('receive_private_message', message);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message privé:', error);
      }
    });

    // Recevoir un message de groupe et le transmettre
    socket.on('send_group_message', async (data: { senderId: number; content: string }) => {
      try {
        // En BDD, un receiverId null indique un message de groupe
        const message = await prisma.message.create({
          data: {
            content: data.content,
            senderId: data.senderId,
            receiverId: null, 
          },
          include: { sender: { select: { firstName: true, lastName: true, role: true } } }
        });

        // Diffusion à tous les employés
        io.to('group_employes').emit('receive_group_message', message);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message de groupe:', error);
      }
    });

    // BONUS : Indicateur "En train d'écrire"
    socket.on('typing', (data: { senderName: string; receiverId?: number; isGroup?: boolean }) => {
      if (data.isGroup) {
        socket.to('group_employes').emit('user_typing', { name: data.senderName, isGroup: true });
      } else if (data.receiverId) {
        socket.to(`user_${data.receiverId}`).emit('user_typing', { name: data.senderName, isGroup: false });
      }
    });

    socket.on('stop_typing', (data: { receiverId?: number; isGroup?: boolean }) => {
      if (data.isGroup) {
        socket.to('group_employes').emit('user_stop_typing', { isGroup: true });
      } else if (data.receiverId) {
        socket.to(`user_${data.receiverId}`).emit('user_stop_typing', { isGroup: false });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Déconnexion WebSocket : ${socket.id}`);
    });
  });
};
