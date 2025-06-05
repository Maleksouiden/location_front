const { query } = require('./config/database-sqlite');

async function checkBiensColumns() {
  try {
    console.log('🔍 Vérification des colonnes de la table biens...');

    // Récupérer une propriété existante pour voir les colonnes
    const existingProperty = await query('SELECT * FROM biens LIMIT 1');
    
    if (existingProperty.length > 0) {
      console.log('\n📋 Colonnes disponibles dans la table biens:');
      const columns = Object.keys(existingProperty[0]);
      columns.forEach(column => {
        console.log(`  - ${column}`);
      });

      console.log('\n🏠 Exemple de propriété existante:');
      const property = existingProperty[0];
      console.log(`  ID: ${property.id}`);
      console.log(`  Titre: ${property.titre}`);
      console.log(`  Prix: ${property.prix}`);
      console.log(`  Ville: ${property.ville}`);
      console.log(`  Propriétaire ID: ${property.proprietaire_id}`);
    } else {
      console.log('❌ Aucune propriété trouvée dans la base de données');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  checkBiensColumns().then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
}

module.exports = { checkBiensColumns };
