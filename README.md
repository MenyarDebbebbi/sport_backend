# 🏋️ Backend API Sport

Backend complet pour l'application sport avec MongoDB, Express.js et authentification JWT.

## 🚀 Installation

### Prérequis

- Node.js (version 16 ou supérieure)
- MongoDB (local ou cloud)
- npm ou yarn

### Configuration

1. **Cloner le projet**

```bash
cd back
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configuration de l'environnement**

```bash
cp env.example .env
```

4. **Modifier le fichier .env**

```env
# Configuration du serveur
PORT=3000
NODE_ENV=development

# Base de données MongoDB
MONGODB_URI=mongodb://localhost:27017/sport_app

# JWT (JSON Web Token)
JWT_SECRET=votre_secret_jwt_tres_securise_ici
JWT_EXPIRE=7d

# Bcrypt
BCRYPT_ROUNDS=12

# Frontend URL (pour CORS)
FRONTEND_URL=http://localhost:5173
```

5. **Initialiser la base de données**

```bash
npm run seed
```

6. **Démarrer le serveur**

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📊 Structure de la base de données

### Modèles MongoDB

#### User (Utilisateur)

- Informations personnelles (nom, email, téléphone, ville)
- Informations de santé (tension, diabète, cholestérol, allergies, etc.)
- Statut (actif, en attente, inactif)
- Rôle (utilisateur, coach, admin)
- Coach assigné

#### Exercise (Exercice)

- Nom, description, catégorie
- Groupes musculaires ciblés
- Niveau de difficulté
- Équipement requis
- Instructions et conseils
- Durée et calories

#### Workout (Entraînement)

- Nom, description, type
- Liste d'exercices avec paramètres (séries, répétitions, poids, repos)
- Niveau de difficulté
- Public/privé
- Utilisateurs assignés

#### Meal (Repas)

- Nom, description, type (petit-déjeuner, déjeuner, dîner, collation)
- Liste d'aliments avec valeurs nutritionnelles
- Statut (en attente, approuvé, rejeté)
- Notes de révision

## 🔐 Authentification

### JWT (JSON Web Token)

- Tokens d'accès avec expiration
- Refresh tokens
- Middleware d'authentification
- Autorisation par rôles

### Rôles utilisateurs

- **Admin** : Accès complet à toutes les fonctionnalités
- **Coach** : Gestion des utilisateurs, exercices, entraînements et repas
- **User** : Accès limité à ses propres données

## 📡 API Endpoints

### Authentification

```
POST /api/auth/register    - Inscription
POST /api/auth/login       - Connexion
GET  /api/auth/profile     - Profil utilisateur
PUT  /api/auth/profile     - Mise à jour du profil
POST /api/auth/logout      - Déconnexion
```

### Utilisateurs

```
GET    /api/users          - Liste des utilisateurs (admin/coach)
GET    /api/users/:id      - Détails d'un utilisateur
POST   /api/users          - Créer un utilisateur (admin/coach)
PUT    /api/users/:id      - Mettre à jour un utilisateur
DELETE /api/users/:id      - Supprimer un utilisateur (admin)
GET    /api/users/stats    - Statistiques (admin)
GET    /api/users/coaches  - Liste des coachs
```

### Exercices

```
GET    /api/exercises                    - Liste des exercices
GET    /api/exercises/:id                - Détails d'un exercice
POST   /api/exercises                    - Créer un exercice (admin/coach)
PUT    /api/exercises/:id                - Mettre à jour un exercice
DELETE /api/exercises/:id                - Supprimer un exercice
GET    /api/exercises/category/:category - Par catégorie
GET    /api/exercises/muscle-group/:group - Par groupe musculaire
GET    /api/exercises/stats              - Statistiques
```

### Entraînements

```
GET    /api/workouts                    - Liste des entraînements
GET    /api/workouts/:id                - Détails d'un entraînement
POST   /api/workouts                    - Créer un entraînement (admin/coach)
PUT    /api/workouts/:id                - Mettre à jour un entraînement
DELETE /api/workouts/:id                - Supprimer un entraînement
GET    /api/workouts/user/:userId       - Entraînements d'un utilisateur
GET    /api/workouts/type/:type         - Par type
GET    /api/workouts/stats              - Statistiques
```

### Repas

```
GET    /api/meals                       - Liste des repas
GET    /api/meals/:id                   - Détails d'un repas
POST   /api/meals                       - Créer un repas
PUT    /api/meals/:id                   - Mettre à jour un repas
DELETE /api/meals/:id                   - Supprimer un repas
PATCH  /api/meals/:id/review            - Réviser un repas (admin/coach)
GET    /api/meals/user/:userId          - Repas d'un utilisateur
GET    /api/meals/type/:type            - Par type
GET    /api/meals/stats                 - Statistiques
```

## 🔧 Fonctionnalités

### Gestion des utilisateurs

- CRUD complet des utilisateurs
- Gestion des rôles et permissions
- Informations de santé personnalisées
- Assignation de coachs
- Statistiques utilisateurs

### Gestion des exercices

- Catalogue d'exercices complet
- Filtrage par catégorie, difficulté, groupe musculaire
- Instructions détaillées et conseils
- Valeurs nutritionnelles

### Gestion des entraînements

- Création d'entraînements personnalisés
- Assignation d'exercices avec paramètres
- Entraînements publics/privés
- Suivi des entraînements utilisateur

### Gestion des repas

- Création de repas avec aliments détaillés
- Calcul automatique des valeurs nutritionnelles
- Système de révision par les coachs
- Suivi nutritionnel

### Sécurité

- Validation des données avec express-validator
- Hachage des mots de passe avec bcrypt
- Authentification JWT
- Autorisation par rôles
- Protection CORS
- Middleware de sécurité (helmet)

## 🛠️ Scripts disponibles

```bash
npm start          # Démarrer en mode production
npm run dev        # Démarrer en mode développement
npm run seed       # Initialiser la base de données
npm test           # Exécuter les tests
```

## 📝 Données d'exemple

Le script de seed crée automatiquement :

### Utilisateurs

- **Admin** : admin@sport.com / admin123
- **Coach** : coach@sport.com / coach123
- **User** : user1@sport.com / user123

### Exercices

- Pompes (strength)
- Squats (strength)
- Course à pied (cardio)

### Entraînements

- Entraînement complet débutant
- Cardio HIIT

### Repas

- Petit-déjeuner protéiné (approuvé)
- Déjeuner équilibré (en attente)

## 🔍 Tests

```bash
npm test
```

## 📦 Déploiement

### Variables d'environnement de production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sport_app
JWT_SECRET=secret_tres_securise_production
FRONTEND_URL=https://votre-domaine.com
```

### Déploiement sur Heroku

```bash
heroku create votre-app-sport
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=votre_uri_mongodb
heroku config:set JWT_SECRET=votre_secret
git push heroku main
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :

- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

---

**Développé avec ❤️ pour l'application Sport**
