const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
  console.log('🚀 Initialisation de la base de données MySQL...');
  
  try {
    // Connexion sans spécifier de base de données
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Pas de mot de passe par défaut pour snap MySQL
      port: 3306
    });

    console.log('✅ Connexion MySQL établie');

    // Lire le fichier SQL de schéma
    const schemaPath = path.join(__dirname, '../config/database-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Diviser le schéma en requêtes individuelles
    const queries = schema.split(';').filter(query => query.trim().length > 0);
    
    console.log(`📝 Exécution de ${queries.length} requêtes SQL...`);
    
    for (const query of queries) {
      if (query.trim()) {
        await connection.execute(query);
      }
    }
    
    console.log('✅ Base de données et tables créées avec succès');
    
    // Fermer la connexion
    await connection.end();
    
    console.log('🎉 Initialisation terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

// Exécuter l'initialisation
initializeDatabase();
