import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Map des connexions SSE actives (clé = userId)
export const sseClients: Map<number, Response> = new Map();

// S'abonner au flux SSE
router.get('/stream', (req: Request, res: Response) => {
  const userId = parseInt(req.query.userId as string);
  if (!userId || isNaN(userId)) {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  sseClients.set(userId, res);
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  req.on('close', () => { sseClients.delete(userId); });
});

// GET toutes les actualités (pour hydratation initiale au chargement)
router.get('/news', async (req: Request, res: Response) => {
  try {
    const news = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des actualités' });
  }
});

// POST créer une actualité
router.post('/news', async (req: Request, res: Response) => {
  const { title, content, authorId } = req.body;
  try {
    const news = await prisma.news.create({
      data: { title, content, authorId },
      include: { author: { select: { firstName: true, lastName: true } } },
    });

    const eventData = `data: ${JSON.stringify({ type: 'NEW_NEWS', payload: news })}\n\n`;
    sseClients.forEach((clientRes) => { clientRes.write(eventData); });

    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la news' });
  }
});

// DELETE supprimer une actualité (Admin/Directeur seulement)
router.delete('/news/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.news.delete({ where: { id } });

    // Notifier tous les clients connectés de la suppression
    const eventData = `data: ${JSON.stringify({ type: 'DELETE_NEWS', payload: { id } })}\n\n`;
    sseClients.forEach((clientRes) => { clientRes.write(eventData); });

    res.status(200).json({ message: 'Actualité supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// GET notifications d'un utilisateur (hydratation initiale)
router.get('/notifications/:userId', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
});

// POST envoyer une notification ciblée
router.post('/notifications', async (req: Request, res: Response) => {
  const { content, userId } = req.body;
  try {
    const notification = await prisma.notification.create({
      data: { content, userId },
    });

    const clientRes = sseClients.get(userId);
    if (clientRes) {
      clientRes.write(`data: ${JSON.stringify({ type: 'NEW_NOTIFICATION', payload: notification })}\n\n`);
    }

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'envoi de la notification" });
  }
});

export default router;
