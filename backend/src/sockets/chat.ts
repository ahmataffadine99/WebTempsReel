import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma';

const getPairRoom = (id1: number, id2: number): string => {
  const [a, b] = [id1, id2].sort((x, y) => x - y);
  return `private_${a}_${b}`;
};

export const initChatSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    socket.on('join_private', (payload: { myId: number; partnerId: number }) => {
      const roomName = getPairRoom(payload.myId, payload.partnerId);
      socket.join(roomName);
    });

    socket.on('join_group_chat', (userRole: string) => {
      if (userRole === 'CONSEILLER' || userRole === 'DIRECTEUR') {
        socket.join('group_employes');
      }
    });

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

        const roomName = getPairRoom(data.senderId, data.receiverId);
        io.to(roomName).emit('receive_private_message', message);
      } catch (error) {
        console.error('Erreur envoi message privé:', error);
      }
    });

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
        console.error('Erreur envoi message groupe:', error);
      }
    });

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
      console.log(`Déconnexion: ${socket.id}`);
    });
  });
};
