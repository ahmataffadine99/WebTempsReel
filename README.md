# Banque AVENIR - Application Temps Réel (WebSockets & SSE)

## Membres du groupe
- AHMAT ABDOULAYE AFFADINE (5IWJ) :
- EL WARDI ABDELRAZAKH (5IWJ) :
- MAARIFI ZAKARIA (5IWJ) :


## Installation et Lancement

Le projet est entièrement conteneurisé avec Docker. Pour le lancer, suivez ces étapes :

1. Assurez-vous que Docker et Docker Compose sont installés sur votre machine.
2. Clonez ce dépôt.
3. À la racine du projet (là où se trouve ce fichier), exécutez la commande suivante :
   ```bash
   docker-compose up --build -d
   ```
4. Accédez à l'application via votre navigateur : `http://localhost:5173` (Frontend)
5. L'API (Backend) tourne sur `http://localhost:3000`

## Jeux de données (Fixtures) et Identifiants

Lors du lancement via Docker, les données de test sont automatiquement générées par le script de seed de la base de données.

Vous pouvez utiliser les identifiants suivants pour tester les 3 rôles de l'application :

| Rôle | Email | Mot de passe | Description |
| :--- | :--- | :--- | :--- |
| **Client** (User) | `client@avenir.fr` | `password123` | Peut voir le feed et contacter son conseiller. |
| **Conseiller** (Modérateur) | `conseiller@avenir.fr` | `password123` | Peut créer des actualités, envoyer des notifications, chatter avec clients et directeurs. |
| **Directeur** (Admin) | `directeur@avenir.fr` | `password123` | A accès au chat de groupe des employés et se distingue visuellement. |

## Fonctionnalités Techniques

- **Frontend** : React, Vite, TypeScript, Tailwind CSS
- **Backend** : Node.js, Express, TypeScript
- **Base de données** : PostgreSQL avec Prisma ORM
- **Web Temps Réel** : 
  - WebSockets (`socket.io`) pour les chats privés et de groupe.
  - Server-Sent Events (SSE) pour le flux d'actualités et les notifications.
