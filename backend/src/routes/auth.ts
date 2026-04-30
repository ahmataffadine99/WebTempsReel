import { Router } from 'express';
import { register, login, verifyEmail } from '../controllers/authController';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyEmail);

router.post('/create-employee', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!['CONSEILLER', 'DIRECTEUR'].includes(role)) {
      res.status(400).json({ error: 'Role invalide.' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'Cet email est deja utilise' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName, role, isVerified: true },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    res.status(201).json({ message: 'Compte employe cree.', user });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, role: true, email: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
