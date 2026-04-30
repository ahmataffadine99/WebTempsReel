import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { prisma } from '../prisma';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, role: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
