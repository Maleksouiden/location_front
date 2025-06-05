# 🚀 Guide de Déploiement - Karya.tn

## 📋 Prérequis

### Système
- **Node.js** 16+ 
- **npm** ou **yarn**
- **Git**
- **SQLite 3**

### Comptes requis
- **GitHub** (pour le code source)
- **Serveur** (VPS, AWS, Heroku, etc.)
- **Nom de domaine** (optionnel)

## 🏗️ Architecture de déploiement

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   React App     │◄──►│   Node.js API   │
│   Port 3001     │    │   Port 3000     │
└─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   SQLite DB     │
                       │   database.db   │
                       └─────────────────┘
```

## 📦 Installation sur serveur

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
cd ..
```

### 3. Configuration de l'environnement

Créer un fichier `.env` :
```env
# Base de données
DATABASE_PATH=./data/karya_tn.db

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Serveur
PORT=3000
NODE_ENV=production

# CORS
FRONTEND_URL=http://localhost:3001

# Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 4. Initialisation de la base de données
```bash
node scripts/init-sqlite.js
node scripts/insert-test-data.js
```

### 5. Build du frontend
```bash
cd frontend
npm run build
cd ..
```

## 🌐 Déploiement Production

### Option 1: Serveur VPS (Ubuntu/Debian)

#### Installation Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Installation PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

#### Configuration PM2
Créer `ecosystem.config.js` :
```javascript
module.exports = {
  apps: [{
    name: 'karya-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

#### Démarrage avec PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Configuration Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/Project_A/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Heroku

#### Préparation
```bash
# Installer Heroku CLI
npm install -g heroku

# Login
heroku login

# Créer l'app
heroku create karya-tn-app
```

#### Configuration Heroku
```bash
# Variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_key
heroku config:set FRONTEND_URL=https://karya-tn-app.herokuapp.com

# Déploiement
git push heroku main
```

#### Procfile pour Heroku
```
web: node server.js
```

### Option 3: Vercel (Frontend) + Railway (Backend)

#### Frontend sur Vercel
```bash
# Installer Vercel CLI
npm install -g vercel

# Dans le dossier frontend
cd frontend
vercel --prod
```

#### Backend sur Railway
1. Connecter le repo GitHub à Railway
2. Configurer les variables d'environnement
3. Déploiement automatique

## 🔧 Configuration avancée

### Variables d'environnement production
```env
# Sécurité
JWT_SECRET=complex_secret_key_256_bits
BCRYPT_ROUNDS=12

# Base de données
DATABASE_PATH=/app/data/production.db

# CORS
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Upload
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=50

# Logs
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log
```

### SSL/HTTPS avec Let's Encrypt
```bash
# Installation Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d your-domain.com

# Renouvellement automatique
sudo crontab -e
# Ajouter: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring et Logs

### PM2 Monitoring
```bash
# Statut des processus
pm2 status

# Logs en temps réel
pm2 logs

# Monitoring
pm2 monit

# Redémarrage
pm2 restart all
```

### Logs personnalisés
```javascript
// Dans server.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

## 🔒 Sécurité Production

### Checklist sécurité
- [ ] Changer tous les secrets par défaut
- [ ] Configurer HTTPS
- [ ] Activer le rate limiting
- [ ] Configurer CORS correctement
- [ ] Sauvegardes automatiques de la DB
- [ ] Monitoring des erreurs
- [ ] Logs de sécurité

### Sauvegarde base de données
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp /app/data/production.db /app/backups/backup_$DATE.db

# Garder seulement les 30 dernières sauvegardes
find /app/backups -name "backup_*.db" -mtime +30 -delete
```

### Cron pour sauvegardes
```bash
# Sauvegarder chaque jour à 2h du matin
0 2 * * * /app/scripts/backup-db.sh
```

## 🧪 Tests de déploiement

### Script de test post-déploiement
```bash
#!/bin/bash
# test-deployment.sh

echo "🧪 Test de déploiement Karya.tn"

# Test API Health
echo "Testing API health..."
curl -f http://localhost:3000/api/health || exit 1

# Test authentification
echo "Testing authentication..."
curl -f -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@karya.tn","mot_de_passe":"password123"}' || exit 1

# Test biens
echo "Testing properties endpoint..."
curl -f http://localhost:3000/api/biens || exit 1

echo "✅ Tous les tests passent !"
```

## 📈 Performance

### Optimisations recommandées
- **Compression gzip** dans Nginx
- **Cache statique** pour les assets
- **CDN** pour les images
- **Database indexing** pour les requêtes fréquentes
- **Connection pooling** si migration vers PostgreSQL

### Configuration Nginx optimisée
```nginx
# Compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Cache statique
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🚨 Dépannage

### Problèmes courants

#### Port déjà utilisé
```bash
# Trouver le processus
sudo lsof -i :3000
# Tuer le processus
sudo kill -9 PID
```

#### Permissions fichiers
```bash
# Corriger les permissions
sudo chown -R www-data:www-data /app
sudo chmod -R 755 /app
```

#### Base de données corrompue
```bash
# Vérifier l'intégrité
sqlite3 database.db "PRAGMA integrity_check;"
# Restaurer depuis sauvegarde
cp /app/backups/backup_latest.db /app/data/production.db
```

## 📞 Support

Pour toute question de déploiement :
- **Documentation** : `/docs`
- **Issues GitHub** : https://github.com/Maleksouiden/Project_A/issues
- **Email** : maleksouiden689@gmail.com

---

**Karya.tn** - Déploiement réussi ! 🎉
