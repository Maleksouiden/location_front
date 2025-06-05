const { query } = require('./config/database-sqlite');

async function testPropertyAPI() {
  try {
    console.log('🔍 Test de l\'API des propriétés avec propriétaires...');

    // Test 1: Récupérer une propriété avec JOIN sur utilisateurs
    console.log('\n1. Test récupération propriété avec propriétaire:');
    
    const propertyWithOwner = await query(`
      SELECT 
        b.*,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.email as proprietaire_email,
        u.telephone as proprietaire_telephone
      FROM biens b
      LEFT JOIN utilisateurs u ON b.proprietaire_id = u.id
      WHERE b.id = 1
    `);

    if (propertyWithOwner.length > 0) {
      const property = propertyWithOwner[0];
      console.log('✅ Propriété trouvée:');
      console.log(`   Titre: ${property.titre}`);
      console.log(`   Propriétaire: ${property.proprietaire_prenom} ${property.proprietaire_nom}`);
      console.log(`   Email: ${property.proprietaire_email}`);
      console.log(`   Téléphone: ${property.proprietaire_telephone}`);
    } else {
      console.log('❌ Aucune propriété trouvée');
    }

    // Test 2: Récupérer toutes les propriétés avec propriétaires
    console.log('\n2. Test récupération toutes propriétés avec propriétaires:');
    
    const allPropertiesWithOwners = await query(`
      SELECT 
        b.id,
        b.titre,
        b.prix,
        b.ville,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.email as proprietaire_email,
        u.telephone as proprietaire_telephone
      FROM biens b
      LEFT JOIN utilisateurs u ON b.proprietaire_id = u.id
      ORDER BY b.id
      LIMIT 5
    `);

    console.log(`✅ ${allPropertiesWithOwners.length} propriétés trouvées:`);
    allPropertiesWithOwners.forEach(property => {
      console.log(`   ${property.id}: ${property.titre} - ${property.ville}`);
      console.log(`      Propriétaire: ${property.proprietaire_prenom} ${property.proprietaire_nom} (${property.proprietaire_email})`);
    });

    // Test 3: Vérifier les propriétés sans propriétaire
    console.log('\n3. Test propriétés sans propriétaire:');
    
    const propertiesWithoutOwner = await query(`
      SELECT b.id, b.titre, b.proprietaire_id
      FROM biens b
      LEFT JOIN utilisateurs u ON b.proprietaire_id = u.id
      WHERE u.id IS NULL
    `);

    if (propertiesWithoutOwner.length > 0) {
      console.log(`⚠️  ${propertiesWithoutOwner.length} propriétés sans propriétaire trouvées:`);
      propertiesWithoutOwner.forEach(property => {
        console.log(`   ${property.id}: ${property.titre} (proprietaire_id: ${property.proprietaire_id})`);
      });
    } else {
      console.log('✅ Toutes les propriétés ont un propriétaire valide');
    }

    // Test 4: Vérifier la structure de réponse pour l'API
    console.log('\n4. Test structure de réponse API:');
    
    const apiResponse = await query(`
      SELECT 
        b.id,
        b.titre,
        b.description,
        b.type_bien,
        b.statut,
        b.prix,
        b.modalite_paiement,
        b.surface,
        b.nombre_pieces,
        b.adresse_complete,
        b.ville,
        b.code_postal,
        b.latitude,
        b.longitude,
        b.date_publication,
        b.statut_publication,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.email as proprietaire_email,
        u.telephone as proprietaire_telephone,
        u.role as proprietaire_role
      FROM biens b
      LEFT JOIN utilisateurs u ON b.proprietaire_id = u.id
      WHERE b.id = 1
    `);

    if (apiResponse.length > 0) {
      const response = apiResponse[0];
      console.log('✅ Structure de réponse API complète:');
      console.log('   Champs propriété:', Object.keys(response).filter(key => !key.startsWith('proprietaire_')));
      console.log('   Champs propriétaire:', Object.keys(response).filter(key => key.startsWith('proprietaire_')));
      
      // Simuler la réponse JSON
      const jsonResponse = {
        success: true,
        data: {
          bien: response
        }
      };
      
      console.log('\n📋 Exemple de réponse JSON:');
      console.log(JSON.stringify(jsonResponse, null, 2));
    }

    console.log('\n🎉 Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
if (require.main === module) {
  testPropertyAPI().then(() => {
    console.log('\n✅ Script de test terminé');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
}

module.exports = { testPropertyAPI };
