import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// On stocke les connexions actives. 
// Clé = userId, Valeur = objet Response d'Express
export const sseClients: Map<number, Response> = new Map();

// Endpoint pour s'abonner aux événements SSE
router.get('/stream', (req: Request, res: Response) => {
  // En situation réelle, l'ID utilisateur serait extrait d'un token JWT.
  // Ici, on le passe en query parameter pour simplifier (ex: /sse/stream?userId=1)
  const userId = parseInt(req.query.userId as string);

  if (!userId || isNaN(userId)) {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  // Configuration des headers essentiels pour le SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // On enregistre le client
  sseClients.set(userId, res);

  // Événement de bienvenue pour confirmer la connexion
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connecté au flux SSE' })}\n\n`);

  // Gérer la déconnexion du client
  req.on('close', () => {
    sseClients.delete(userId);
  });
});

// Endpoint pour publier une actualité (Réservé aux Conseillers/Directeurs)
router.post('/news', async (req: Request, res: Response) => {
  const { title, content, authorId } = req.body;

  try {
    const news = await prisma.news.create({
      data: { title, content, authorId },
      include: { author: { select: { firstName: true, lastName: true } } }
    });

    // On diffuse la news à TOUS les clients connectés
    const eventData = `data: ${JSON.stringify({ type: 'NEW_NEWS', payload: news })}\n\n`;
    sseClients.forEach((clientRes) => {
      clientRes.write(eventData);
    });

    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la news' });
  }
});

// Endpoint pour envoyer une notification ciblée (Réservé aux Conseillers)
router.post('/notifications', async (req: Request, res: Response) => {
  const { content, userId } = req.body;

  try {
    const notification = await prisma.notification.create({
      data: { content, userId },
    });

    // On envoie la notification UNIQUEMENT au client concerné s'il est connecté
    const clientRes = sseClients.get(userId);
    if (clientRes) {
      clientRes.write(`data: ${JSON.stringify({ type: 'NEW_NOTIFICATION', payload: notification })}\n\n`);
    }

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification' });
  }
});

export default router;
