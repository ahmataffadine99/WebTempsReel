import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET historique des messages privés entre deux utilisateurs
router.get('/private/:userId/:partnerId', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const partnerId = parseInt(req.params.partnerId);
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { firstName: true, lastName: true, role: true } } },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

// GET historique des messages de groupe
router.get('/group', async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      where: { receiverId: null },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { firstName: true, lastName: true, role: true } } },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des messages de groupe' });
  }
});

export default router;
