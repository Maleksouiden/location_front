# 🧪 Guide de Test Rapide - Karya.tn

## 🚀 Démarrage Rapide

```bash
# Démarrer l'application complète
./start-karya.sh

# Ou manuellement :
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && PORT=3001 npm start
```

## 📋 Scénario de Test Complet (10 minutes)

### 1. 👤 Créer un Vendeur (2 min)
1. Ouvrir http://localhost:3001
2. Cliquer "S'inscrire"
3. Remplir le formulaire :
   - Nom : `Vendeur`
   - Prénom : `Test`
   - Email : `vendeur@test.com`
   - Téléphone : `12345678`
   - **Sélectionner "Vendeur"** ⚠️
   - Mot de passe : `password123`
4. Cliquer "S'inscrire"

### 2. 🏠 Ajouter une Propriété (3 min)
1. Aller dans "Mes Propriétés"
2. Cliquer "Ajouter une propriété"
3. Remplir les informations :
   - Titre : `Appartement Test`
   - Type : `Appartement`
   - Prix : `150000`
   - Surface : `85`
   - Pièces : `3`
4. **Tester la carte** :
   - Cliquer sur la carte pour sélectionner une adresse
   - Observer l'auto-remplissage de la ville et code postal
   - Vérifier la description automatique
5. Ajouter des images (optionnel)
6. Publier la propriété

### 3. 👥 Créer un Acheteur (1 min)
1. Se déconnecter
2. S'inscrire avec :
   - Email : `acheteur@test.com`
   - **Sélectionner "Acheteur"** ⚠️
   - Autres infos similaires

### 4. 💬 Tester la Messagerie (2 min)
1. Aller dans "Propriétés"
2. Cliquer sur la propriété créée
3. Cliquer "Contacter le vendeur"
4. Vérifier la redirection vers "Messages"
5. Envoyer un message
6. Se reconnecter en tant que vendeur
7. Vérifier la réception du message
8. Répondre au message

### 5. 📅 Tester les Rendez-vous (2 min)
1. En tant qu'acheteur, sur la page de la propriété
2. Cliquer "Demander une visite"
3. Vérifier le toast de confirmation
4. Aller dans "Rendez-vous" pour voir la demande
5. Se reconnecter en tant que vendeur
6. Aller dans "Rendez-vous"
7. Accepter ou refuser la demande
8. Se reconnecter en tant qu'acheteur
9. Vérifier la réponse du vendeur

## 🔍 Tests Spécifiques des Corrections

### Test 1 : Extraction de Ville
1. Créer une propriété
2. Sur la carte, cliquer sur une adresse complexe comme :
   `شارع معاوية إبن أبي سفيان, El Izdihar, Ariana`
3. ✅ Vérifier que "Ariana" est extrait (pas la rue)

### Test 2 : Sélection de Rôle
1. S'inscrire
2. ✅ Vérifier que la sélection vendeur/acheteur fonctionne
3. ✅ Vérifier qu'aucun rôle null n'est envoyé

### Test 3 : Images CORS
1. Ajouter une propriété avec images
2. ✅ Vérifier que les images s'affichent correctement
3. ✅ Pas d'erreur CORS dans la console

### Test 4 : Géocodage
1. Créer une propriété
2. Utiliser la carte pour sélectionner une adresse
3. ✅ Vérifier que l'adresse est récupérée
4. ✅ Pas d'erreur CORS Nominatim dans la console

### Test 5 : Responsive
1. Réduire la taille de la fenêtre (mobile)
2. ✅ Vérifier que la navbar s'adapte
3. ✅ Menu hamburger fonctionnel

## 🧪 Tests API (Optionnel)

```bash
# Test géocodage
curl "http://localhost:3000/api/geocode/reverse?lat=36.8065&lon=10.1815"

# Test recherche adresses
curl "http://localhost:3000/api/geocode/search?q=Ariana"

# Test images
curl -I "http://localhost:3000/uploads/villa1_main.jpg"

# Test API propriétés
curl "http://localhost:3000/api/biens"
```

## ✅ Checklist de Validation

### Fonctionnalités Core
- [ ] ✅ Inscription vendeur/acheteur
- [ ] ✅ Connexion/déconnexion
- [ ] ✅ Création de propriété
- [ ] ✅ Upload d'images
- [ ] ✅ Sélection d'adresse sur carte
- [ ] ✅ Auto-remplissage ville/code postal
- [ ] ✅ Messagerie vendeur-acheteur
- [ ] ✅ Demande de rendez-vous
- [ ] ✅ Gestion des rendez-vous

### Corrections Appliquées
- [ ] ✅ Extraction de ville correcte
- [ ] ✅ Sélection de rôle fonctionnelle
- [ ] ✅ Navbar responsive
- [ ] ✅ Pas d'erreur CORS géocodage
- [ ] ✅ Images affichées correctement

### Interface Utilisateur
- [ ] ✅ Design moderne et cohérent
- [ ] ✅ Messages de feedback (toasts)
- [ ] ✅ Navigation intuitive
- [ ] ✅ Responsive sur mobile
- [ ] ✅ Chargement fluide

## 🐛 Problèmes Connus

### Warnings TypeScript (Non bloquants)
- Quelques warnings de compilation TypeScript
- N'affectent pas le fonctionnement
- Peuvent être ignorés pour les tests

### Limitations Actuelles
- Système de rendez-vous simplifié (pas de calendrier)
- Recherche IA basique (peut être améliorée)
- Pas de notifications push en temps réel

## 🎯 Résultats Attendus

Après ce test, vous devriez avoir :
- ✅ 2 utilisateurs créés (vendeur + acheteur)
- ✅ 1 propriété publiée avec images
- ✅ 1 conversation active
- ✅ 1 demande de rendez-vous traitée
- ✅ Toutes les fonctionnalités validées

## 🚀 Prêt pour la Production

Si tous les tests passent, l'application est prête pour :
- Déploiement en production
- Tests utilisateur étendus
- Ajout de nouvelles fonctionnalités
- Optimisations de performance

**🎉 Karya.tn est maintenant une plateforme immobilière complète et fonctionnelle !**
