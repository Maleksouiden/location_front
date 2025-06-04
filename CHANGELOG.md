# Changelog - Karya.tn

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-01-04

### ✨ Ajouté
- **Système de rendez-vous complet**
  - Gestion des créneaux de visite pour les vendeurs
  - Demande de rendez-vous pour les acheteurs
  - Interface de gestion des demandes pour les vendeurs
  - Suivi des rendez-vous pour les acheteurs
  - Statuts de RDV : libre, en_attente, confirmé, annulé

### 🔧 API - Nouveaux endpoints
- `GET /api/creneaux/demandes` - Demandes de RDV pour vendeurs
- `GET /api/creneaux/mes-rdv` - RDV pour acheteurs
- `POST /api/rdv/demander` - Demander un RDV
- Amélioration des endpoints existants avec plus de données

### 🎨 Frontend - Nouvelles pages
- **AppointmentRequests** (`/demandes-rdv`) - Gestion des demandes (vendeurs)
- **MyAppointments** (`/mes-rdv`) - Suivi des RDV (acheteurs)
- Intégration dans la navigation sidebar
- Interface moderne avec statuts colorés

### 🐛 Corrections
- **Assignation des rôles dans les conversations**
  - Correction de la logique d'assignation acheteur/vendeur
  - Support des conversations vendeur-à-vendeur
  - Vérification bidirectionnelle des conversations existantes
- **Messages correctement attribués**
  - Affichage des noms complets (prénom + nom)
  - Suppression des "undefined" dans l'interface
  - Ordre chronologique respecté

### 📚 Documentation
- Documentation complète du système de rendez-vous
- Mise à jour du README avec les nouveaux endpoints
- Guide d'utilisation et exemples d'API
- Diagrammes de flux de fonctionnement

### 🧪 Tests
- Script de test automatisé pour le système de RDV
- Tests de bout en bout : création → demande → acceptation
- Validation des données retournées
- Tests des permissions et rôles

## [2.0.0] - 2025-01-03

### ✨ Ajouté
- **Système de messagerie en temps réel**
  - Chat entre acheteurs et vendeurs
  - Création automatique de conversations
  - Interface moderne et responsive
  - Rafraîchissement automatique des messages

### 🔧 API - Endpoints messagerie
- `GET /api/conversations` - Liste des conversations
- `GET /api/conversations/:id/messages` - Messages d'une conversation
- `POST /api/conversations` - Créer une conversation
- `POST /api/conversations/:id/messages` - Envoyer un message
- `POST /api/conversations/direct` - Conversation directe entre utilisateurs

### 🎨 Frontend - Pages messagerie
- **MessageList** (`/messages`) - Liste des conversations
- **ChatRoom** (`/messages/:id`) - Interface de chat
- Intégration du bouton "Contact" sur les fiches biens
- Navigation fluide entre les conversations

### 🗄️ Base de données
- Tables `conversations` et `messages`
- Relations avec utilisateurs et biens
- Gestion des statuts et dates
- Index pour les performances

## [1.5.0] - 2025-01-02

### ✨ Ajouté
- **Système de suggestions personnalisées**
  - Algorithme de scoring basé sur les préférences
  - Suggestions automatiques pour les acheteurs
  - Historique des suggestions vues
  - Interface dédiée pour consulter les suggestions

### 🔧 API - Endpoints suggestions
- `GET /api/suggestions` - Obtenir des suggestions
- `PUT /api/suggestions/:bienId/vue` - Marquer comme vu
- `GET /api/suggestions/historique` - Historique
- `POST /api/preferences` - Définir ses préférences
- `GET /api/preferences` - Récupérer ses préférences

### 🎨 Frontend - Gestion des préférences
- **Preferences** (`/preferences`) - Configuration des préférences
- **Suggestions** (`/suggestions`) - Consultation des suggestions
- Formulaires interactifs avec validation
- Affichage du score de pertinence

## [1.0.0] - 2025-01-01

### ✨ Ajouté - Version initiale
- **Authentification complète**
  - Inscription et connexion sécurisées
  - JWT pour la gestion des sessions
  - 3 rôles : Acheteur, Vendeur, Administrateur
  - Middleware de protection des routes

### 🏠 Gestion des biens immobiliers
- **CRUD complet pour les biens**
  - Création, lecture, modification, suppression
  - Upload et gestion des photos
  - Recherche avancée avec filtres
  - Géolocalisation avec cartes interactives

### 🔧 API REST complète
- **Endpoints biens** : `/api/biens/*`
- **Endpoints utilisateurs** : `/api/utilisateurs/*`
- **Endpoints authentification** : `/api/auth/*`
- **Endpoints administration** : `/api/admin/*`
- Documentation automatique des endpoints

### 🎨 Interface utilisateur
- **React 18 avec TypeScript**
- **Styled Components** pour le styling
- **Navigation responsive** selon les rôles
- **Tableaux de bord** personnalisés par rôle

### 🗄️ Base de données
- **SQLite** avec schéma complet
- **Données de test** pré-chargées
- **7 utilisateurs** de test
- **6 biens immobiliers** d'exemple

### 🔒 Sécurité
- **Hachage bcrypt** des mots de passe
- **Validation** des données d'entrée
- **Protection CORS**
- **Rate limiting**
- **Helmet** pour la sécurité des headers

### 👥 Administration
- **Tableau de bord** avec statistiques
- **Gestion des utilisateurs**
- **Modération des biens**
- **Gestion des sponsors**

---

## Types de changements
- ✨ **Ajouté** pour les nouvelles fonctionnalités
- 🔧 **Modifié** pour les changements dans les fonctionnalités existantes
- 🐛 **Corrigé** pour les corrections de bugs
- 🗑️ **Supprimé** pour les fonctionnalités supprimées
- 🔒 **Sécurité** pour les vulnérabilités corrigées
- 📚 **Documentation** pour les changements de documentation
- 🎨 **Interface** pour les changements d'interface utilisateur
- 🗄️ **Base de données** pour les changements de schéma
- 🧪 **Tests** pour les ajouts ou modifications de tests
