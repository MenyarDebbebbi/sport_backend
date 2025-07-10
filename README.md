# Backend API Sport

Backend Express.js pour l'application sport avec authentification JWT, gestion des utilisateurs, exercices et entraînements.

## 🚀 Fonctionnalités

- **Authentification JWT** : Inscription, connexion, gestion des tokens
- **Gestion des utilisateurs** : Profils, rôles (user, trainer, admin)
- **Gestion des exercices** : CRUD complet avec catégorisation et recherche
- **Gestion des entraînements** : Création d'entraînements personnalisés
- **Système de favoris** : Pour les exercices et entraînements
- **Recherche avancée** : Filtres, tri, pagination
- **Validation des données** : Express-validator avec messages personnalisés
- **Sécurité** : Helmet, CORS, validation des entrées
- **Base de données** : MongoDB avec Mongoose

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- MongoDB (local ou Atlas)
- npm ou yarn

## 🛠️ Installation

1. **Cloner le projet**

```bash
cd back
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configuration des variables d'environnement**

```bash
cp env.example .env
```

4. **Modifier le fichier `.env`**

```env
# Configuration du serveur
PORT=3000
NODE_ENV=development

# Configuration de la base de données
MONGODB_URI=mongodb://localhost:27017/sport_app

# Configuration JWT
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRES_IN=7d

# Configuration CORS
FRONTEND_URL=http://localhost:5173

# Configuration de sécurité
BCRYPT_ROUNDS=12
```

5. **Démarrer le serveur**

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

## 📚 Structure du projet

```
back/
├── src/
│   ├── config/
│   │   └── database.js          # Configuration MongoDB
│   ├── controllers/
│   │   └── authController.js    # Contrôleur d'authentification
│   ├── middleware/
│   │   ├── auth.js              # Middleware d'authentification JWT
│   │   └── validation.js        # Middleware de validation
│   ├── models/
│   │   ├── User.js              # Modèle utilisateur
│   │   ├── Exercise.js          # Modèle exercice
│   │   └── Workout.js           # Modèle entraînement
│   ├── routes/
│   │   ├── auth.js              # Routes d'authentification
│   │   ├── exercises.js         # Routes des exercices
│   │   ├── users.js             # Routes des utilisateurs
│   │   └── workouts.js          # Routes des entraînements
│   └── server.js                # Point d'entrée de l'application
├── public/                      # Fichiers statiques
├── package.json
├── env.example
└── README.md
```

## 🔌 API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur
- `PUT /api/auth/profile` - Mise à jour du profil
- `PUT /api/auth/change-password` - Changement de mot de passe
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/refresh-token` - Rafraîchir le token

### Utilisateurs

- `GET /api/users` - Liste des utilisateurs (admin)
- `GET /api/users/:id` - Détails d'un utilisateur
- `PUT /api/users/:id` - Mise à jour d'un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur (admin)
- `PATCH /api/users/:id/toggle-status` - Activer/désactiver (admin)
- `GET /api/users/stats/overview` - Statistiques (admin)
- `GET /api/users/search/users` - Recherche d'utilisateurs (admin)

### Exercices

- `GET /api/exercises` - Liste des exercices
- `GET /api/exercises/:id` - Détails d'un exercice
- `POST /api/exercises` - Créer un exercice
- `PUT /api/exercises/:id` - Mettre à jour un exercice
- `DELETE /api/exercises/:id` - Supprimer un exercice
- `POST /api/exercises/:id/favorite` - Ajouter/retirer des favoris
- `GET /api/exercises/popular/list` - Exercices populaires

### Entraînements

- `GET /api/workouts` - Liste des entraînements
- `GET /api/workouts/:id` - Détails d'un entraînement
- `POST /api/workouts` - Créer un entraînement
- `PUT /api/workouts/:id` - Mettre à jour un entraînement
- `DELETE /api/workouts/:id` - Supprimer un entraînement
- `POST /api/workouts/:id/favorite` - Ajouter/retirer des favoris
- `POST /api/workouts/:id/complete` - Marquer comme terminé
- `GET /api/workouts/popular/list` - Entraînements populaires
- `GET /api/workouts/user/my-workouts` - Mes entraînements

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Headers requis

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Exemple de requête authentifiée

```javascript
fetch("/api/exercises", {
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Content-Type": "application/json",
  },
});
```

## 📊 Modèles de données

### User

```javascript
{
  username: String,
  email: String,
  password: String (hashé),
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String,
  height: Number,
  weight: Number,
  fitnessLevel: String,
  goals: [String],
  role: String,
  isActive: Boolean,
  // ... autres champs
}
```

### Exercise

```javascript
{
  name: String,
  description: String,
  category: String,
  muscleGroups: [String],
  difficulty: String,
  equipment: [String],
  instructions: [Object],
  tips: [String],
  videoUrl: String,
  imageUrl: String,
  duration: Number,
  caloriesPerMinute: Number,
  createdBy: ObjectId,
  rating: Object,
  favorites: [ObjectId]
}
```

### Workout

```javascript
{
  name: String,
  description: String,
  type: String,
  difficulty: String,
  duration: Number,
  exercises: [Object],
  targetMuscleGroups: [String],
  equipment: [String],
  calories: Number,
  isPublic: Boolean,
  createdBy: ObjectId,
  rating: Object,
  favorites: [ObjectId],
  completedCount: Number
}
```

## 🛡️ Sécurité

- **Helmet** : Headers de sécurité
- **CORS** : Configuration des origines autorisées
- **Validation** : Validation des entrées avec express-validator
- **Sanitisation** : Nettoyage des données d'entrée
- **JWT** : Tokens sécurisés avec expiration
- **Bcrypt** : Hachage des mots de passe
- **Rate limiting** : Protection contre les attaques par déni de service

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests en mode watch
npm run test:watch
```

## 📝 Scripts disponibles

```bash
npm start          # Démarrer en mode production
npm run dev        # Démarrer en mode développement
npm test           # Lancer les tests
npm run lint       # Vérifier le code
```

## 🔧 Configuration

### Variables d'environnement

| Variable         | Description              | Défaut                              |
| ---------------- | ------------------------ | ----------------------------------- |
| `PORT`           | Port du serveur          | 3000                                |
| `NODE_ENV`       | Environnement            | development                         |
| `MONGODB_URI`    | URI de connexion MongoDB | mongodb://localhost:27017/sport_app |
| `JWT_SECRET`     | Secret pour JWT          | -                                   |
| `JWT_EXPIRES_IN` | Expiration du token      | 7d                                  |
| `FRONTEND_URL`   | URL du frontend          | http://localhost:5173               |
| `BCRYPT_ROUNDS`  | Rounds pour bcrypt       | 12                                  |

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
