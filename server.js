const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bienRoutes = require('./routes/biens');
const conversationRoutes = require('./routes/conversations');
const appointmentRoutes = require('./routes/appointments');
const creneauRoutes = require('./routes/creneaux');
const suggestionRoutes = require('./routes/suggestions');
const adminRoutes = require('./routes/admin');

// Import de la configuration de base de données
const { db, query, testConnection } = require('./config/database-sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pour les fichiers statiques avec CORS
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', userRoutes);
app.use('/api/biens', bienRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/appointments', appointmentRoutes);

// Proxy pour Nominatim (éviter les problèmes CORS)
app.get('/api/geocode/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const axios = require('axios');

    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format: 'json',
        lat: lat,
        lon: lon,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'Karya.tn/1.0'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erreur geocoding:', error);
    res.status(500).json({ error: 'Erreur lors du géocodage' });
  }
});

app.get('/api/geocode/search', async (req, res) => {
  try {
    const { q } = req.query;
    const axios = require('axios');

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        format: 'json',
        q: q,
        countrycodes: 'tn',
        limit: 5,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'Karya.tn/1.0'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erreur search geocoding:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche d\'adresses' });
  }
});
app.use('/api/creneaux', creneauRoutes);
app.use('/api/rdv', creneauRoutes); // Alias pour les rendez-vous
app.use('/api/preferences', suggestionRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/admin', adminRoutes);

// Route de santé
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'Connected' : 'Disconnected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// Route temporaire pour mettre à jour les images de test
app.post('/api/update-test-images', (req, res) => {
  try {
    const updates = [
      { id: 32, photo: '/uploads/maison1_main.jpg' },
      { id: 33, photo: '/uploads/appart1_main.jpg' },
      { id: 34, photo: '/uploads/appart2_main.jpg' },
      { id: 35, photo: '/uploads/villa1_main.jpg' },
      { id: 8, photo: '/uploads/maison2_main.jpg' },
      { id: 7, photo: '/uploads/terrain1_main.jpg' },
      { id: 6, photo: '/uploads/bureau1_main.jpg' },
      { id: 5, photo: '/uploads/appart3_main.jpg' }
    ];

    const updateStmt = db.prepare('UPDATE biens SET photo_principale = ? WHERE id = ?');
    let updated = 0;

    updates.forEach(({ id, photo }) => {
      const result = updateStmt.run(photo, id);
      if (result.changes > 0) {
        updated++;
        console.log(`✅ Bien ${id} mis à jour avec ${photo}`);
      }
    });

    // Vérifier les résultats
    const biensAvecImages = db.prepare('SELECT id, titre, photo_principale FROM biens WHERE photo_principale IS NOT NULL').all();

    res.json({
      message: `${updated} biens mis à jour avec des images`,
      biensAvecImages: biensAvecImages
    });
  } catch (error) {
    console.error('Erreur mise à jour images:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des images' });
  }
});

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    message: 'API Karya.tn - Plateforme Immobilière',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/utilisateurs',
      properties: '/api/biens',
      conversations: '/api/conversations',
      appointments: '/api/creneaux',
      suggestions: '/api/suggestions',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    message: `La route ${req.originalUrl} n'existe pas`
  });
});

// Démarrage du serveur
async function startServer() {
  try {
    // Test de connexion à la base de données
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Impossible de se connecter à la base de données');
    }

    app.listen(PORT, () => {
      console.log('🚀 Serveur Karya.tn démarré avec succès !');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Base de données: SQLite (connectée)`);
      console.log('📚 Documentation API disponible sur: http://localhost:' + PORT);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

startServer();
