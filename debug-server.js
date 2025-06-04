// Script de débogage pour identifier les problèmes de démarrage

console.log('🔍 DÉBOGAGE DU SERVEUR');
console.log('='.repeat(30));

try {
  console.log('1. Chargement des modules...');
  
  const express = require('express');
  console.log('   ✅ Express chargé');
  
  const cors = require('cors');
  console.log('   ✅ CORS chargé');
  
  const mysql = require('mysql2/promise');
  console.log('   ✅ MySQL chargé');
  
  console.log('\n2. Test de connexion à la base de données...');
  
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'karya_tn'
  };
  
  mysql.createConnection(dbConfig).then(connection => {
    console.log('   ✅ Connexion DB réussie');
    connection.end();
    
    console.log('\n3. Test de création du serveur Express...');
    
    const app = express();
    console.log('   ✅ App Express créée');
    
    app.use(cors());
    app.use(express.json());
    console.log('   ✅ Middleware configuré');
    
    // Test route simple
    app.get('/test', (req, res) => {
      res.json({ message: 'Test OK' });
    });
    console.log('   ✅ Route de test ajoutée');
    
    console.log('\n4. Test de démarrage du serveur...');
    
    const server = app.listen(3001, () => {
      console.log('   ✅ Serveur démarré sur le port 3001');
      console.log('\n🎉 DÉBOGAGE TERMINÉ - SERVEUR FONCTIONNEL');
      console.log('💡 Test: curl http://localhost:3001/test');
      
      // Arrêter le serveur après 5 secondes
      setTimeout(() => {
        server.close(() => {
          console.log('\n🛑 Serveur arrêté');
          process.exit(0);
        });
      }, 5000);
    });
    
  }).catch(error => {
    console.log('   ❌ Erreur DB:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.log('❌ Erreur lors du chargement:', error.message);
  console.log('Stack:', error.stack);
  process.exit(1);
}
