import bcrypt from 'bcrypt';
import { prisma } from '../src/prisma';

async function main() {
  console.log('Début de la génération des fixtures...');

  // Nettoyage de la base
  await prisma.notification.deleteMany();
  await prisma.news.deleteMany();
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Création des 3 rôles
  const client = await prisma.user.create({
    data: {
      email: 'client@avenir.fr',
      password: hashedPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'CLIENT',
    },
  });

  const conseiller = await prisma.user.create({
    data: {
      email: 'conseiller@avenir.fr',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Martin',
      role: 'CONSEILLER',
    },
  });

  const directeur = await prisma.user.create({
    data: {
      email: 'directeur@avenir.fr',
      password: hashedPassword,
      firstName: 'Paul',
      lastName: 'Dubois',
      role: 'DIRECTEUR',
    },
  });

  // Création d'une actualité (News)
  await prisma.news.create({
    data: {
      title: 'Bienvenue chez Banque AVENIR',
      content: 'Nous sommes ravis de vous présenter notre nouvelle plateforme bancaire temps réel.',
      authorId: conseiller.id,
    },
  });

  // Création d'une notification
  await prisma.notification.create({
    data: {
      content: 'Votre compte a été activé avec succès.',
      userId: client.id,
    },
  });

  console.log('Fixtures générées avec succès !');
  console.log('- Client :', client.email);
  console.log('- Conseiller :', conseiller.email);
  console.log('- Directeur :', directeur.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
