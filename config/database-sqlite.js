const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Chemin vers la base de données SQLite
const dbPath = path.join(__dirname, '../data/karya_tn.db');

// Création de la connexion SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion SQLite:', err.message);
  } else {
    console.log('✅ Connexion SQLite établie avec succès');
  }
});

// Fonction pour exécuter des requêtes avec promesses
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const sqlTrimmed = sql.trim().toLowerCase();

    if (sqlTrimmed.startsWith('select') || sqlTrimmed.startsWith('with')) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Erreur SELECT:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Erreur INSERT/UPDATE/DELETE:', err);
          reject(err);
        } else {
          const result = {
            insertId: this.lastID,
            affectedRows: this.changes,
            lastID: this.lastID,
            changes: this.changes
          };
          resolve(result);
        }
      });
    }
  });
}

// Fonction pour les transactions
async function transaction(callback) {
  return new Promise(async (resolve, reject) => {
    db.serialize(async () => {
      try {
        await query('BEGIN TRANSACTION');
        const result = await callback(query);
        await query('COMMIT');
        resolve(result);
      } catch (error) {
        await query('ROLLBACK');
        reject(error);
      }
    });
  });
}

// Test de connexion
async function testConnection() {
  try {
    await query('SELECT 1 as test');
    console.log('✅ Test de connexion SQLite réussi');
    return true;
  } catch (error) {
    console.error('❌ Erreur de test SQLite:', error.message);
    return false;
  }
}

// Fermeture propre de la base de données
function closeDatabase() {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture:', err.message);
      } else {
        console.log('Base de données SQLite fermée');
      }
      resolve();
    });
  });
}

module.exports = {
  db,
  query,
  transaction,
  testConnection,
  closeDatabase
};
