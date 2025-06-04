const fs = require('fs').promises;
const path = require('path');
const { query, testConnection } = require('../config/database-sqlite');

async function initializeSQLiteDatabase() {
  console.log('🚀 Initialisation de la base de données SQLite...');
  
  try {
    // Test de connexion
    await testConnection();

    // Lire le fichier SQL de schéma SQLite
    const schemaPath = path.join(__dirname, '../config/database-schema-sqlite.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Diviser le schéma en requêtes individuelles
    const queries = schema.split(';').filter(query => query.trim().length > 0);
    
    console.log(`📝 Exécution de ${queries.length} requêtes SQL...`);
    
    for (const sqlQuery of queries) {
      if (sqlQuery.trim()) {
        await query(sqlQuery);
      }
    }
    
    console.log('✅ Base de données SQLite et tables créées avec succès');
    console.log('🎉 Initialisation terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

// Exécuter l'initialisation
initializeSQLiteDatabase();
