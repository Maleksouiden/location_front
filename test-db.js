const bcrypt = require('bcrypt');
const { query, closeDatabase } = require('./config/database-sqlite');

async function testDatabase() {
  console.log('🧪 Test de la base de données...');
  
  try {
    // Test simple
    const result = await query('SELECT 1 as test');
    console.log('✅ Requête test réussie:', result);
    
    // Test insertion utilisateur
    const hashedPassword = await bcrypt.hash('test123', 12);
    const userResult = await query(
      'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['Test', 'User', 'test@example.com', hashedPassword, 'acheteur']
    );
    console.log('✅ Utilisateur inséré:', userResult);
    
    // Vérifier l'insertion
    const users = await query('SELECT * FROM utilisateurs WHERE email = ?', ['test@example.com']);
    console.log('✅ Utilisateur récupéré:', users[0]);
    
    // Nettoyer
    await query('DELETE FROM utilisateurs WHERE email = ?', ['test@example.com']);
    console.log('✅ Nettoyage effectué');
    
    console.log('🎉 Test de base de données réussi !');
    
  } catch (error) {
    console.error('❌ Erreur test DB:', error);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

testDatabase();
