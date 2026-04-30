# Banque AVENIR - Application Web Temps Réel

## Membres du groupe

| Prénom NOM | Classe |
| :--- | :--- |
| AHMAT ABDOULAYE AFFADINE | 5IWJ |
| ElWARDI ABDELRAZAKH | 5IWJ |
| ZAKARIA MAARIFI | 5IWJ |

---

## Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (version 24 ou supérieure)

Aucune autre dépendance n'est nécessaire (Node.js, npm, PostgreSQL sont gérés par Docker).

---

## Installation et Lancement

### Étape 1 - Extraire le projet

Décompresser l'archive ZIP dans le dossier de votre choix, puis ouvrir un terminal à la racine du projet (là où se trouve le fichier `docker-compose.yml`).

### Étape 2 - Lancer l'application

```bash
docker compose up --build -d
```

Cette commande effectue automatiquement :
1. Construction des images Docker
2. Démarrage de la base de données PostgreSQL
3. Application des migrations (création du schéma)
4. Injection des données de test (seed)
5. Démarrage du backend (port 3000) et du frontend (port 5173)

Le premier démarrage peut prendre 1 à 2 minutes.

### Étape 3 - Accéder à l'application

| Service | URL |
| :--- | :--- |
| Application (Frontend) | http://localhost:5173 |
| API (Backend) | http://localhost:3000 |

---

## Jeux de données (Fixtures) et Comptes de test

Les données de test sont injectées automatiquement au démarrage. Aucune manipulation manuelle n'est nécessaire.

| Role | Email | Mot de passe |
| :--- | :--- | :--- |
| Client | `client@avenir.fr` | `password123` |
| Conseiller | `conseiller@avenir.fr` | `password123` |
| Directeur | `directeur@avenir.fr` | `password123` |

Pour tester les fonctionnalités temps réel, ouvrez 3 onglets ou 3 navigateurs différents avec un compte par rôle simultanément.

---

## Guide de test des fonctionnalités

### Inscription d'un nouveau client

1. Aller sur http://localhost:5173/login
2. Cliquer sur "S'inscrire" en bas du formulaire
3. Remplir le formulaire et soumettre
4. Récupérer le lien de confirmation dans les logs du backend :
   ```bash
   docker compose logs backend
   ```
5. Copier l'URL `https://ethereal.email/message/...` et l'ouvrir dans le navigateur
6. Cliquer sur "Confirmer mon compte"
7. Se connecter avec les identifiants choisis

**Note :** Ethereal Email est un serveur SMTP de test standard pour le développement. Il intercèpte les emails et les rend accessibles via une URL de prévisualisation, sans envoyer de vrai email.

### Messagerie privée (WebSockets)

- Connectez-vous en tant que Client et en tant que Conseiller (deux onglets)
- Le client choisit son interlocuteur dans la liste à gauche du chat
- Les messages s'affichent en temps réel des deux côtés
- L'indicateur "est en train d'écrire..." apparaît pendant la saisie

### Chat de groupe employés

- Connectez-vous en tant que Conseiller et Directeur
- Cliquer sur l'onglet "Groupe" dans la messagerie
- Les messages circulent en temps réel entre tous les employés connectés

### Flux d'actualités (SSE)

- Connectez-vous en tant que Conseiller ou Directeur
- Dans le panneau droit, onglet "Actualités", publier une actualité
- Le client connecté la reçoit instantanément dans sa colonne gauche
- Le Directeur peut supprimer une actualité en survolant la carte

### Notifications ciblées (SSE + Web Push)

- Dans le panneau droit, onglet "Notifs", choisir un destinataire et envoyer
- Le destinataire reçoit la notification dans l'application ET une notification native du navigateur
- Le badge rouge sur la cloche en haut s'incrémente et disparaît au clic

### Création d'un compte employé (Directeur uniquement)

- Dans le panneau droit, onglet "Equipe", remplir le formulaire
- Choisir le rôle Conseiller ou Directeur
- Le compte est actif immédiatement

---

## Architecture technique

### Stack

| Couche | Technologie |
| :--- | :--- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Base de données | PostgreSQL 15 |
| ORM | Prisma v7 |
| Conteneurisation | Docker Compose |

### Communication temps réel

| Protocole | Usage |
| :--- | :--- |
| WebSockets (Socket.io) | Chat privé et chat de groupe |
| SSE (Server-Sent Events) | Flux d'actualités et notifications |
| Web Push API | Notifications natives système déclenchées par SSE |

---

## Commandes utiles

```bash
# Lancer le projet
docker compose up --build -d

# Voir les logs du backend (pour récupérer les liens Ethereal)
docker compose logs -f backend

# Redémarrer uniquement le backend
docker compose restart backend

# Arrêter le projet en conservant les données
docker compose down

# Arrêter le projet et supprimer la base de données
docker compose down -v

# Voir l'état des conteneurs
docker compose ps
```
