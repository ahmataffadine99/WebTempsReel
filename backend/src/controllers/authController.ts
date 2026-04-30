import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Cet email est déjà utilisé' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'CLIENT', // Par défaut CLIENT
      },
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe requis' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Identifiants invalides' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Identifiants invalides' });
      return;
    }

    // Pour simplifier et se concentrer sur le temps réel, on ne fait pas de JWT complexe,
    // on renvoie juste les infos de l'utilisateur qui seront stockées côté frontend (ex: localStorage/Zustand)
    res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
};
