# Karya.tn - Plateforme Immobilière Tunisienne 🏠

Une plateforme immobilière moderne développée avec React et Node.js, spécialement conçue pour le marché tunisien.

## 🚀 Fonctionnalités

### 🏠 **Gestion des Biens**
- ✅ Création, modification et suppression de biens immobiliers
- ✅ Upload et affichage d'images des propriétés
- ✅ Recherche avancée avec filtres (prix, type, localisation)
- ✅ Recherche IA en langage naturel
- ✅ Système de suggestions personnalisées

### 🗺️ **Géolocalisation**
- ✅ Carte interactive pour sélection d'adresses
- ✅ Recherche par ville tunisienne
- ✅ Géolocalisation automatique
- ✅ Affichage des coordonnées GPS

### 💬 **Messagerie**
- ✅ Chat en temps réel entre acheteurs et vendeurs
- ✅ Création automatique de conversations
- ✅ Interface moderne et responsive

### 🗓️ **Système de Rendez-vous**
- ✅ Prise de rendez-vous pour visites
- ✅ Gestion des créneaux de disponibilité (vendeurs)
- ✅ Calendrier interactif
- ✅ Notifications et confirmations

### 👥 **Gestion des Utilisateurs**
- ✅ 3 rôles : Acheteur, Vendeur, Administrateur
- ✅ Authentification sécurisée avec JWT
- ✅ Profils utilisateurs complets
- ✅ Système de préférences

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Styled Components** pour le styling
- **React Router** pour la navigation
- **Axios** pour les appels API
- **Lucide React** pour les icônes

### Backend
- **Node.js** avec Express
- **SQLite** pour la base de données
- **JWT** pour l'authentification
- **Multer** pour l'upload de fichiers
- **CORS** pour les requêtes cross-origin

## 📦 Installation

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn

### 1. Cloner le projet
```bash
git clone https://github.com/Maleksouiden/Project_A.git
cd Project_A
```

### 2. Installation des dépendances

**Backend :**
```bash
npm install
```

**Frontend :**
```bash
cd frontend
npm install
```

### 3. Configuration de la base de données
La base de données SQLite sera créée automatiquement au premier démarrage avec des données de test.

### 4. Démarrage des serveurs

**Backend (Port 3000) :**
```bash
npm start
```

**Frontend (Port 3001) :**
```bash
cd frontend
npm start
```

## 🌐 Accès à l'application

- **Frontend** : http://localhost:3001
- **Backend API** : http://localhost:3000

## 👤 Comptes de test

### Vendeur
- **Email** : mohamed.benali@email.com
- **Mot de passe** : password123

### Acheteur
- **Email** : leila.bouazizi@email.com
- **Mot de passe** : password123

### Administrateur
- **Email** : admin@karya.tn
- **Mot de passe** : admin123

## 📊 Base de Données

La base de données SQLite contient déjà des données de test avec :
- **7 utilisateurs** (1 admin, 3 vendeurs, 3 acheteurs)
- **6 biens immobiliers** (villas, appartements, maisons, etc.)
- **Conversations et messages** entre acheteurs et vendeurs
- **Créneaux de visite** et rendez-vous
- **Préférences acheteurs** pour les suggestions

## 🔐 Comptes de Test

### Admin
- **Email:** admin@karya.tn
- **Mot de passe:** password123
- **Rôle:** Administrateur

### Vendeurs
- **Email:** mohamed.benali@email.com
- **Mot de passe:** password123
- **Rôle:** Vendeur

- **Email:** fatma.trabelsi@email.com
- **Mot de passe:** password123
- **Rôle:** Vendeur

- **Email:** ahmed.gharbi@email.com
- **Mot de passe:** password123
- **Rôle:** Vendeur

### Acheteurs
- **Email:** leila.bouazizi@email.com
- **Mot de passe:** password123
- **Rôle:** Acheteur

- **Email:** sami.khelifi@email.com
- **Mot de passe:** password123
- **Rôle:** Acheteur

- **Email:** nadia.mansouri@email.com
- **Mot de passe:** password123
- **Rôle:** Acheteur

## 🛠 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/verify` - Vérifier le token

### Utilisateurs
- `GET /api/utilisateurs/me` - Profil utilisateur
- `PUT /api/utilisateurs/me` - Modifier le profil
- `GET /api/utilisateurs/:id` - Profil public

### Biens Immobiliers
- `GET /api/biens` - Liste des biens (avec filtres)
- `GET /api/biens/:id` - Détail d'un bien
- `POST /api/biens` - Créer un bien (vendeur)
- `PUT /api/biens/:id` - Modifier un bien (propriétaire)
- `DELETE /api/biens/:id` - Supprimer un bien (propriétaire)
- `GET /api/biens/mes-biens` - Mes biens (vendeur)

### Conversations & Messages
- `GET /api/conversations` - Mes conversations
- `GET /api/conversations/:id/messages` - Messages d'une conversation
- `POST /api/conversations` - Créer une conversation (acheteur)
- `POST /api/conversations/:id/messages` - Envoyer un message

### Rendez-vous & Créneaux
- `GET /api/creneaux` - Mes créneaux (vendeur)
- `GET /api/creneaux/bien/:bienId` - Créneaux disponibles pour un bien
- `POST /api/creneaux` - Créer un créneau (vendeur)
- `PUT /api/creneaux/:id` - Modifier un créneau (vendeur)
- `POST /api/rdv` - Demander un RDV (acheteur)
- `PUT /api/rdv/:id/accepter` - Accepter un RDV (vendeur)
- `PUT /api/rdv/:id/refuser` - Refuser un RDV (vendeur)
- `PUT /api/rdv/:id/annuler` - Annuler un RDV

### Suggestions & Préférences
- `POST /api/preferences` - Définir ses préférences (acheteur)
- `GET /api/preferences` - Récupérer ses préférences (acheteur)
- `GET /api/suggestions` - Obtenir des suggestions (acheteur)
- `PUT /api/suggestions/:bienId/vue` - Marquer comme vu
- `GET /api/suggestions/historique` - Historique des suggestions

### Administration
- `GET /api/admin/dashboard` - Tableau de bord
- `GET /api/admin/utilisateurs` - Gestion des utilisateurs
- `PUT /api/admin/utilisateurs/:id/statut` - Modifier statut utilisateur
- `GET /api/admin/biens` - Modération des biens
- `PUT /api/admin/biens/:id/valider` - Valider/refuser un bien
- `GET /api/admin/sponsors` - Gestion des sponsors
- `POST /api/admin/sponsors` - Créer un sponsor
- `PUT /api/admin/sponsors/:id` - Modifier un sponsor
- `DELETE /api/admin/sponsors/:id` - Supprimer un sponsor

### Utilitaires
- `GET /api/health` - Santé de l'API
- `GET /` - Documentation de base

## 📝 Exemples d'utilisation

### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "leila.bouazizi@email.com",
    "mot_de_passe": "password123"
  }'
```

### Récupérer les biens
```bash
curl http://localhost:3000/api/biens
```

### Récupérer un bien spécifique
```bash
curl http://localhost:3000/api/biens/1
```

### Rechercher des biens par ville
```bash
curl "http://localhost:3000/api/biens?ville=Tunis"
```

### Créer un bien (avec token vendeur)
```bash
curl -X POST http://localhost:3000/api/biens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "titre": "Appartement F3 Tunis",
    "description": "Bel appartement...",
    "type_bien": "appartement",
    "statut": "location",
    "prix": 1200,
    "modalite_paiement": "mensuel",
    "surface": 100,
    "nombre_pieces": 4,
    "adresse_complete": "123 Rue de la République",
    "ville": "Tunis",
    "code_postal": "1000",
    "latitude": 36.8065,
    "longitude": 10.1815
  }'
```

## 🏗 Architecture

```
karya-tn-backend/
├── config/
│   ├── database-sqlite.js      # Configuration SQLite
│   └── database-schema-sqlite.sql
├── middleware/
│   └── auth.js                 # Authentification JWT
├── routes/
│   ├── auth.js                 # Routes d'authentification
│   ├── users.js                # Routes utilisateurs
│   ├── biens.js                # Routes biens immobiliers
│   ├── conversations.js        # Routes messagerie
│   ├── creneaux.js             # Routes rendez-vous
│   ├── suggestions.js          # Routes suggestions
│   └── admin.js                # Routes administration
├── scripts/
│   ├── init-sqlite.js          # Initialisation DB
│   └── insert-test-data.js     # Données de test
├── data/
│   └── karya_tn.db            # Base de données SQLite
├── uploads/                    # Dossier pour les images
├── server.js                   # Serveur principal
└── package.json
```

## 🔒 Sécurité

- **JWT** pour l'authentification
- **Bcrypt** pour le hachage des mots de passe
- **Helmet** pour la sécurité des headers
- **Rate limiting** pour éviter le spam
- **CORS** configuré
- **Validation** des données d'entrée

## 🌟 Fonctionnalités

### Pour les Vendeurs
- ✅ Inscription et connexion
- ✅ Gestion des biens immobiliers (CRUD)
- ✅ Upload de photos
- ✅ Gestion des créneaux de visite
- ✅ Messagerie avec les acheteurs
- ✅ Acceptation/refus des demandes de RDV

### Pour les Acheteurs
- ✅ Inscription et connexion
- ✅ Recherche de biens avec filtres
- ✅ Messagerie avec les vendeurs
- ✅ Demande de rendez-vous
- ✅ Système de suggestions personnalisées
- ✅ Gestion des préférences

### Pour les Administrateurs
- ✅ Tableau de bord avec statistiques
- ✅ Gestion des utilisateurs
- ✅ Modération des biens
- ✅ Gestion des sponsors/publicités

## 🧪 Tests

Pour tester l'API, vous pouvez :

1. **Démarrer le serveur** : `node server.js`
2. **Tester avec curl** : Voir les exemples ci-dessus
3. **Utiliser Postman** : Importer les endpoints
4. **Navigateur** : Aller sur `http://localhost:3000` pour la documentation

## 📈 Statut

✅ **Backend complet et fonctionnel**
- Base de données SQLite initialisée
- Toutes les routes implémentées
- Données de test insérées
- Authentification JWT
- Système de permissions
- Validation des données
- Gestion d'erreurs

Le serveur est prêt pour la production et peut être connecté à un frontend React/Vue.js ou utilisé directement via l'API REST.

## 👨‍💻 Auteur

**Malek Souiden**
- Email: maleksouiden689@gmail.com
- GitHub: [@Maleksouiden](https://github.com/Maleksouiden)

---

**Karya.tn** - Votre partenaire immobilier en Tunisie 🇹🇳
