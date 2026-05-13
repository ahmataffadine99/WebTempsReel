import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { prisma } from '../prisma';
import { getIO } from '../socket';

async function sendVerificationEmail(to: string, token: string) {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const verifyUrl = `http://localhost:5173/verify?token=${token}`;

  const info = await transporter.sendMail({
    from: '"Banque AVENIR" <no-reply@avenir.fr>',
    to: to,
    subject: 'Confirmez votre inscription a Banque AVENIR',
    html: `
      <h1>Bienvenue chez Banque AVENIR !</h1>
      <p>Merci de vous etre inscrit. Cliquez sur le lien ci-dessous pour activer votre compte :</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:5px;">
        Confirmer mon compte
      </a>
      <p>Ou copiez ce lien : ${verifyUrl}</p>
    `,
  });

  console.log('Email envoye. URL de previsualisation Ethereal:', nodemailer.getTestMessageUrl(info));
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'Tous les champs sont obligatoires' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Cet email est deja utilise' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'CLIENT',
        isVerified: false,
        verificationToken,
      },
    });

    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: 'Inscription reussie. Verifiez votre boite mail pour confirmer votre compte.',
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Token invalide' });
      return;
    }

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });

    if (!user) {
      res.status(404).json({ error: 'Token de verification introuvable ou expire' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    const updatedUsers = await prisma.user.findMany({
      where: { isVerified: true },
      select: { id: true, firstName: true, lastName: true, role: true, email: true },
    });
    getIO().emit('users_updated', updatedUsers);

    res.status(200).json({ message: 'Compte verifie. Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error('Erreur verification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
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

    if (!user.isVerified) {
      res.status(403).json({ error: 'Veuillez confirmer votre adresse email avant de vous connecter.' });
      return;
    }

    res.status(200).json({
      message: 'Connexion reussie',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
