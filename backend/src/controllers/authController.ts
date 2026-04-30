import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { prisma } from '../prisma';

// Fonction utilitaire pour envoyer un faux email avec Ethereal
async function sendVerificationEmail(to: string, token: string) {
  // Création d'un compte de test Ethereal
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, 
      pass: testAccount.pass, 
    },
  });

  const verifyUrl = `http://localhost:5173/verify?token=${token}`;

  const info = await transporter.sendMail({
    from: '"Banque AVENIR" <no-reply@avenir.fr>',
    to: to,
    subject: "Confirmez votre inscription à Banque AVENIR",
    html: `
      <h1>Bienvenue chez Banque AVENIR !</h1>
      <p>Merci de vous être inscrit. Veuillez cliquer sur le lien ci-dessous pour activer votre compte :</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:5px;">
        Confirmer mon compte
      </a>
      <p>Ou copiez ce lien : ${verifyUrl}</p>
    `,
  });

  console.log('Message envoyé: %s', info.messageId);
  // C'est ça la magie d'Ethereal : on affiche l'URL pour voir l'email envoyé !
  console.log('URL de prévisualisation de l\'email: %s', nodemailer.getTestMessageUrl(info));
}

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
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'CLIENT', // Par défaut CLIENT
        isVerified: false,
        verificationToken,
      },
    });

    // Envoi de l'email de vérification
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: 'Inscription réussie. Veuillez vérifier votre boîte mail pour confirmer votre compte.',
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Token invalide' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      res.status(404).json({ error: 'Token de vérification introuvable ou expiré' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    res.status(200).json({ message: 'Compte vérifié avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error('Erreur lors de la vérification :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification' });
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
