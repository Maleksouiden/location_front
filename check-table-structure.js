const { db } = require('./config/database-sqlite');

function checkTableStructure() {
  try {
    console.log('🔍 Vérification de la structure des tables...');

    // Structure de la table utilisateurs
    console.log('\n👥 Structure table utilisateurs:');
    try {
      const usersSchema = db.prepare("PRAGMA table_info(utilisateurs)").all();
      if (Array.isArray(usersSchema)) {
        usersSchema.forEach(column => {
          console.log(`  ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
        });
      } else {
        console.log('  Erreur: résultat non-array:', usersSchema);
      }
    } catch (error) {
      console.log('  Erreur:', error.message);
    }

    // Structure de la table biens
    console.log('\n🏠 Structure table biens:');
    try {
      const biensSchema = db.prepare("PRAGMA table_info(biens)").all();
      if (Array.isArray(biensSchema)) {
        biensSchema.forEach(column => {
          console.log(`  ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
        });
      } else {
        console.log('  Erreur: résultat non-array:', biensSchema);
      }
    } catch (error) {
      console.log('  Erreur:', error.message);
    }

    // Vérifier les contraintes de clés étrangères
    console.log('\n🔗 Contraintes de clés étrangères pour biens:');
    const foreignKeys = db.prepare("PRAGMA foreign_key_list(biens)").all();
    foreignKeys.forEach(fk => {
      console.log(`  ${fk.from} -> ${fk.table}.${fk.to}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  checkTableStructure();
  console.log('\n✅ Vérification terminée');
}

module.exports = { checkTableStructure };
