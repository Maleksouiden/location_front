# Karya.tn - Application Frontend React

Application React TypeScript pour la plateforme immobilière Karya.tn.

## 🚀 Fonctionnalités

### Pour tous les utilisateurs
- ✅ Authentification (connexion/inscription)
- ✅ Interface responsive et moderne
- ✅ Navigation intuitive selon le rôle

### Pour les Acheteurs
- ✅ Tableau de bord personnalisé
- ✅ Recherche de biens avec filtres
- ✅ Système de suggestions personnalisées
- ✅ Messagerie avec les vendeurs
- ✅ Demande de rendez-vous
- ✅ Gestion des préférences

### Pour les Vendeurs
- ✅ Gestion des biens immobiliers (CRUD)
- ✅ Upload de photos
- ✅ Gestion des créneaux de visite
- ✅ Messagerie avec les acheteurs
- ✅ Acceptation/refus des demandes de RDV

### Pour les Administrateurs
- ✅ Tableau de bord avec statistiques
- ✅ Gestion des utilisateurs
- ✅ Modération des biens
- ✅ Gestion des sponsors/publicités

## 🛠 Technologies utilisées

- **React 18** avec TypeScript
- **React Router** pour la navigation
- **Styled Components** pour le styling
- **React Hook Form** + **Yup** pour la validation
- **Axios** pour les appels API
- **TanStack Query** pour la gestion des données
- **Lucide React** pour les icônes

## 📦 Installation

1. **Cloner le projet** (si pas déjà fait)
```bash
git clone <repository-url>
cd Project_B
```

2. **Installer les dépendances du backend**
```bash
npm install
```

3. **Installer les dépendances du frontend**
```bash
cd frontend
npm install
cd ..
```

## 🚀 Démarrage

### Option 1: Démarrage automatique (recommandé)
```bash
./start-dev.sh
```

### Option 2: Démarrage manuel

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 🌐 URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Documentation API**: http://localhost:3000

## 👥 Comptes de test

### Administrateur
- Email: `admin@karya.tn`
- Mot de passe: `password123`

### Vendeurs
- Email: `mohamed.benali@email.com` | Mot de passe: `password123`
- Email: `fatma.trabelsi@email.com` | Mot de passe: `password123`
- Email: `ahmed.gharbi@email.com` | Mot de passe: `password123`

### Acheteurs
- Email: `leila.bouazizi@email.com` | Mot de passe: `password123`
- Email: `sami.khelifi@email.com` | Mot de passe: `password123`
- Email: `nadia.mansouri@email.com` | Mot de passe: `password123`

## 📁 Structure du projet

```
frontend/
├── public/                 # Fichiers statiques
├── src/
│   ├── components/        # Composants réutilisables
│   │   └── Layout/       # Composants de mise en page
│   ├── contexts/         # Contextes React (Auth, etc.)
│   ├── pages/            # Pages de l'application
│   │   ├── Auth/         # Pages d'authentification
│   │   ├── Dashboard/    # Tableau de bord
│   │   └── Home/         # Page d'accueil
│   ├── services/         # Services API
│   ├── types/            # Types TypeScript
│   ├── App.tsx           # Composant principal
│   └── index.tsx         # Point d'entrée
├── .env                  # Variables d'environnement
└── package.json          # Dépendances et scripts
```

## 🔧 Configuration

### Variables d'environnement (.env)
```
PORT=3001
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_BACKEND_URL=http://localhost:3000
```

## 🎨 Thème et Design

L'application utilise un design moderne avec :
- Palette de couleurs cohérente
- Interface responsive (mobile-first)
- Composants styled-components
- Icônes Lucide React
- Animations et transitions fluides

## 🔐 Authentification

- JWT tokens stockés dans localStorage
- Vérification automatique de la validité des tokens
- Redirection automatique selon l'état d'authentification
- Routes protégées par rôle

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🚧 Développement

### Commandes utiles

```bash
# Démarrer en mode développement
npm start

# Construire pour la production
npm run build

# Lancer les tests
npm test

# Analyser le bundle
npm run build && npx serve -s build
```

### Structure des composants

Chaque composant suit cette structure :
- Props typées avec TypeScript
- Styled Components pour le styling
- Hooks personnalisés si nécessaire
- Gestion d'erreur appropriée

## 🔄 État de l'application

L'état est géré via :
- **Context API** pour l'authentification
- **TanStack Query** pour les données serveur
- **React Hook Form** pour les formulaires
- **Local State** pour l'UI

## ✅ Fonctionnalités implémentées

### Interface utilisateur moderne
- ✅ Design responsive et moderne avec Styled Components
- ✅ Page d'accueil avec recherche guidée et biens populaires
- ✅ Interface de recherche avancée avec filtres
- ✅ Navigation intuitive selon le rôle utilisateur

### Authentification complète
- ✅ Pages de connexion et inscription
- ✅ Gestion des sessions avec JWT
- ✅ Protection des routes selon l'authentification
- ✅ Contexte d'authentification global

### Gestion des biens immobiliers
- ✅ Liste des biens avec filtres et tri
- ✅ Page de détail d'un bien avec toutes les informations
- ✅ Interface de gestion des biens pour les vendeurs
- ✅ Formulaire d'ajout/modification de biens
- ✅ Liaison complète avec l'API backend

### Système de messagerie
- ✅ Liste des conversations
- ✅ Interface de chat en temps réel
- ✅ Création de conversations depuis les biens
- ✅ Historique des messages

### Tableaux de bord personnalisés
- ✅ Dashboard différent selon le rôle (acheteur/vendeur/admin)
- ✅ Statistiques et métriques importantes
- ✅ Accès rapide aux fonctionnalités principales

## 🎯 Prochaines étapes

- [ ] Système de notifications en temps réel
- [ ] Gestion complète des créneaux et RDV
- [ ] Interface d'administration complète
- [ ] Système de suggestions personnalisées
- [ ] Upload et gestion des photos
- [ ] Tests unitaires et d'intégration
- [ ] PWA (Progressive Web App)
- [ ] Optimisations de performance

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de connexion API**
   - Vérifier que le backend est démarré
   - Vérifier les URLs dans .env

2. **Erreur de compilation TypeScript**
   - Vérifier les types dans src/types/
   - Redémarrer le serveur de développement

3. **Problème de CORS**
   - Vérifier la configuration CORS du backend
   - Vérifier les URLs dans .env

## 📞 Support

Pour toute question ou problème, consultez :
- La documentation du backend (README.md)
- Les logs de la console navigateur
- Les logs du serveur backend
