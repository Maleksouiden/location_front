# 🔧 Guide de Résolution CORS - Karya.tn

## ❌ Problème Initial

```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:3000/api/auth/login. (Reason: CORS request did not succeed). Status code: (null).
```

## 🔍 Diagnostic du Problème

### 1. **Conflit de Ports**
- Frontend et Backend utilisaient le même port (3000)
- Configuration CORS incomplète
- Headers manquants pour les requêtes OPTIONS

### 2. **Configuration CORS Insuffisante**
- Origins limitées
- Headers manquants
- Pas de gestion des requêtes preflight

## ✅ Solutions Appliquées

### 1. **Configuration CORS Complète (server.js)**

```javascript
// Configuration CORS améliorée
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  optionsSuccessStatus: 200 // Pour supporter les anciens navigateurs
}));

// Middleware pour gérer les requêtes OPTIONS (preflight)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
```

### 2. **Séparation des Ports**

```bash
# Backend sur port 3000
BACKEND_PORT=3000 node server.js

# Frontend sur port 3001
cd frontend && PORT=3001 npm start
```

### 3. **Configuration Frontend (api.ts)**

```typescript
// Configuration axios améliorée
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000, // Timeout augmenté
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Désactivé pour éviter les problèmes CORS
});
```

### 4. **Configuration Timeout**

```typescript
// config.ts - Timeout augmenté
api: {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  backendURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000',
  timeout: 15000, // Augmenté de 10s à 15s
},
```

## 🚀 Script de Démarrage Automatique

### Utilisation du Script

```bash
# Rendre le script exécutable
chmod +x start-karya-fixed.sh

# Démarrer l'application
./start-karya-fixed.sh
```

### Fonctionnalités du Script

```bash
✅ Vérification des dépendances
✅ Installation automatique si nécessaire
✅ Création des dossiers requis
✅ Démarrage backend sur port 3000
✅ Démarrage frontend sur port 3001
✅ Gestion propre des processus (Ctrl+C)
✅ Logs colorés et informatifs
```

## 🧪 Tests de Validation

### 1. **Test API Backend**

```bash
# Test de santé
curl http://localhost:3000/api/health

# Test de login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  -d '{"email":"admin@karya.tn","mot_de_passe":"password123"}'
```

### 2. **Test CORS Headers**

```bash
# Test requête OPTIONS (preflight)
curl -X OPTIONS http://localhost:3000/api/auth/login \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

### 3. **Test Frontend**

```bash
# Accéder au frontend
http://localhost:3001

# Tester la connexion depuis l'interface
# Email: admin@karya.tn
# Mot de passe: password123
```

## 🎯 Configuration Finale

### Ports Utilisés

```
🔧 Backend API: http://localhost:3000
🌐 Frontend: http://localhost:3001
📚 Documentation: http://localhost:3000
```

### Comptes de Test

```
👨‍💼 Admin: admin@karya.tn / password123
🏪 Vendeur: mohamed.benali@email.com / password123
🛒 Acheteur: leila.bouazizi@email.com / password123
```

### URLs d'API

```
POST /api/auth/login - Connexion
POST /api/auth/register - Inscription
GET /api/biens - Liste des propriétés
GET /api/biens/:id - Détail propriété
GET /api/health - Santé de l'API
```

## 🔧 Dépannage

### Si CORS persiste

1. **Vérifier les ports**
   ```bash
   lsof -i :3000  # Backend
   lsof -i :3001  # Frontend
   ```

2. **Redémarrer les serveurs**
   ```bash
   # Arrêter tous les processus
   pkill -f "node server.js"
   pkill -f "react-scripts"
   
   # Redémarrer avec le script
   ./start-karya-fixed.sh
   ```

3. **Vider le cache du navigateur**
   ```
   Ctrl+Shift+R (Chrome/Firefox)
   Ou ouvrir en navigation privée
   ```

4. **Vérifier la configuration**
   ```bash
   # Vérifier les variables d'environnement
   echo $BACKEND_PORT
   echo $PORT
   ```

## ✅ Résultat Final

```
🎉 CORS complètement résolu !

✅ Backend sur port 3000 avec CORS configuré
✅ Frontend sur port 3001 avec timeout augmenté
✅ Headers CORS complets
✅ Gestion des requêtes OPTIONS
✅ Script de démarrage automatique
✅ Tests validés et fonctionnels

🚀 Application prête pour le développement !
```

## 📝 Notes Importantes

1. **En production**, modifier les origins CORS pour inclure le domaine réel
2. **Sécurité** : Désactiver `credentials: true` si non nécessaire
3. **Performance** : Ajuster les timeouts selon les besoins
4. **Monitoring** : Surveiller les logs CORS en production

## 🎯 Prochaines Étapes

1. Tester toutes les fonctionnalités de l'application
2. Valider les uploads d'images
3. Tester les WebSockets si utilisés
4. Préparer la configuration de production
