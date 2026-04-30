# 🏦 Banque AVENIR — Application Temps Réel

> Plateforme bancaire en temps réel avec messagerie instantanée (WebSockets), flux d'actualités et notifications (SSE), et notifications natives du navigateur (Web Push API).

---

## 👥 Membres du groupe

| Prénom NOM | Classe |
| :--- | :--- |
| **AHMAT** ABDOULAYE AFFADINE | 5IWJ |
| **ElWARDI** ABDELRAZAKH | 5IWJ |
| **ZAKARIA** MAARIFI | 5IWJ |

---

## 📋 Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (version 24+)
- [Git](https://git-scm.com/)

Aucune autre dépendance n'est nécessaire (Node.js, npm, PostgreSQL) — tout est géré par Docker.

---

## 🚀 Installation et Lancement

### Étape 1 — Cloner le dépôt

```bash
git clone git@github.com:ahmataffadine99/WebTempsReel.git
cd WebTempsReel
```

### Étape 2 — Lancer l'application complète

```bash
docker compose up --build -d
```

Cette commande unique effectue automatiquement les opérations suivantes :
1. Construction des images Docker (backend, frontend, base de données)
2. Démarrage de la base de données PostgreSQL
3. Application des migrations Prisma (création du schéma)
4. Injection des données de test (fixtures / seed)
5. Démarrage du serveur Node.js (port 3000)
6. Démarrage du serveur Vite React (port 5173)

> ⏳ Le premier démarrage peut prendre 1 à 2 minutes le temps de construire les images.

### Étape 3 — Accéder à l'application

| Service | URL |
| :--- | :--- |
| **Frontend (Application)** | http://localhost:5173 |
| **Backend (API REST)** | http://localhost:3000 |

---

## 🗄️ Jeux de données (Fixtures) et Comptes de Test

Les données de test sont **injectées automatiquement** au démarrage via le script `prisma/seed.ts`. Aucune action manuelle n'est nécessaire.

### Comptes pré-configurés

| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Client** | `client@avenir.fr` | `password123` |
| **Conseiller** | `conseiller@avenir.fr` | `password123` |
| **Directeur** | `directeur@avenir.fr` | `password123` |

> 💡 **Conseil pour les tests** : Ouvrez 3 onglets (ou 3 navigateurs différents) simultanément avec un compte de chaque rôle pour tester les fonctionnalités temps réel.

---

## 🧪 Guide de Test des Fonctionnalités

### 1. Inscription d'un nouveau Client

1. Aller sur http://localhost:5173/login
2. Cliquer sur **"S'inscrire"** (lien en bas du formulaire)
3. Remplir le formulaire (Prénom, Nom, Email, Mot de passe)
4. Cliquer sur **"Créer mon compte"**
5. Vérifier les logs du backend pour récupérer le lien de vérification Ethereal :
   ```bash
   docker compose logs backend
   ```
6. Copier l'URL `https://ethereal.email/message/...` affichée dans les logs
7. Ouvrir le lien → Cliquer sur le bouton **"Confirmer mon compte"**
8. Se connecter avec les identifiants choisis

> 📧 **Ethereal Email** est un serveur SMTP de test (standard pour les projets étudiants). Il simule un envoi email réel sans spammer de vraie boîte mail. Le lien de confirmation est visible dans les logs du terminal.

### 2. Messagerie en temps réel (WebSockets)

**Client → Employé :**
- Connectez-vous en tant que Client
- Dans la colonne centrale, choisissez un contact (Conseiller ou Directeur) dans la liste à gauche
- Envoyez un message → il apparaît instantanément chez l'employé

**Chat de groupe Employés :**
- Connectez-vous en tant que Conseiller ET Directeur (deux onglets)
- Cliquez sur l'onglet **"Groupe"** chez les deux
- Les messages circulent en temps réel entre tous les employés

**Indicateur de frappe :**
- Commencez à taper un message → l'autre utilisateur voit "X est en train d'écrire..."

### 3. Flux d'Actualités (SSE)

- Connectez-vous en tant que Conseiller ou Directeur
- Aller dans le panneau droit → onglet **"Actualités"**
- Publier une actualité
- → Le client connecté reçoit l'actualité **instantanément** dans sa colonne gauche

**Suppression d'actualité (Directeur uniquement) :**
- Survoler une actualité → icône 🗑️ rouge apparaît → Cliquer pour supprimer

### 4. Notifications ciblées (SSE + Web Push)

- Connectez-vous en tant que Conseiller ou Directeur
- Aller dans le panneau droit → onglet **"Notifs"**
- Choisir un destinataire dans la liste (Client, Conseiller ou Directeur)
- Envoyer la notification
- → Le destinataire reçoit la notification dans sa liste **ET** une pop-up native du navigateur (🔔 en bas à droite Windows/Mac)
- → Le badge rouge de la cloche en haut s'incrémente ; cliquer dessus le réinitialise

### 5. Création d'un compte Employé (Directeur uniquement)

- Connectez-vous en tant que Directeur
- Aller dans le panneau droit → onglet **"Équipe"**
- Remplir le formulaire et choisir le rôle (Conseiller / Directeur)
- Le compte est immédiatement actif (pas de confirmation email requise pour les employés)

---

## 🏗️ Architecture Technique

### Stack

| Couche | Technologie |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Base de données** | PostgreSQL 15 |
| **ORM** | Prisma v7 |
| **Conteneurisation** | Docker Compose |

### Communication Temps Réel

| Protocole | Usage |
| :--- | :--- |
| **WebSockets** (Socket.io) | Chat privé et chat de groupe (bi-directionnel) |
| **SSE** (Server-Sent Events) | Flux d'actualités et notifications push (serveur → client) |
| **Web Push API** | Notifications natives OS déclenchées par les événements SSE |

### Isolation des Conversations

Les rooms WebSocket utilisent un système **paire-basé** : chaque conversation privée entre deux utilisateurs crée une room unique `private_{minId}_{maxId}`. Cela garantit que la conversation `Client A ↔ Conseiller` est totalement isolée de `Client A ↔ Directeur`.

---

## 📁 Structure du Projet

```
WebTempsReel/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Modèle de données
│   │   ├── seed.ts            # Fixtures (données de test)
│   │   └── migrations/        # Migrations SQL
│   ├── src/
│   │   ├── controllers/
│   │   │   └── authController.ts  # Inscription + Vérification email
│   │   ├── routes/
│   │   │   ├── auth.ts        # Routes d'authentification
│   │   │   ├── sse.ts         # Routes SSE (news, notifications)
│   │   │   └── messages.ts    # Routes historique messages
│   │   ├── sockets/
│   │   │   └── chat.ts        # Logique WebSocket
│   │   └── index.ts           # Point d'entrée serveur
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── SseContext.tsx # Connexion SSE partagée (singleton)
│   │   │   └── NavContext.tsx # Navigation sidebar
│   │   ├── components/
│   │   │   ├── Chat.tsx          # Messagerie WebSocket
│   │   │   ├── NewsFeed.tsx      # Flux actualités SSE
│   │   │   ├── NotificationList.tsx  # Notifications SSE
│   │   │   ├── AdminPanel.tsx    # Panneau employés
│   │   │   ├── Header.tsx        # En-tête + badge notifications
│   │   │   └── Sidebar.tsx       # Navigation
│   │   └── pages/
│   │       ├── Login.tsx         # Connexion + Inscription
│   │       ├── Verify.tsx        # Confirmation email
│   │       └── Dashboard.tsx     # Interface principale
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🔧 Commandes Utiles

```bash
# Démarrer le projet (première fois ou après modification)
docker compose up --build -d

# Voir les logs en temps réel (utile pour récupérer le lien Ethereal)
docker compose logs -f backend

# Redémarrer uniquement le backend (sans reconstruire)
docker compose restart backend

# Arrêter le projet (les données sont conservées)
docker compose down

# Arrêter le projet ET supprimer la base de données (repart à zéro)
docker compose down -v

# Voir l'état des conteneurs
docker compose ps
```

---

## ⚠️ Notes Importantes

> **Ne jamais faire `docker compose down -v`** pendant une session de test si vous avez créé des données (comptes, messages, etc.). Le flag `-v` supprime le volume de la base de données — toutes les données sont effacées. Utilisez simplement `docker compose down` pour conserver les données.

> **Confirmation d'inscription** : Pour les comptes créés via le formulaire d'inscription public, le lien de vérification est disponible dans les logs du backend (`docker compose logs backend`). Copier et ouvrir l'URL `ethereal.email` affichée, puis cliquer sur "Confirmer mon compte".
