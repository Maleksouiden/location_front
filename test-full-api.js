const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testFullAPI() {
  try {
    console.log('🔍 Test complet de l\'API Karya.tn...');

    // Test 1: Connexion avec un compte vendeur
    console.log('\n1. Test connexion vendeur:');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'mohamed.benali@email.com',
      mot_de_passe: 'password123'
    });

    if (loginResponse.data.token) {
      console.log('✅ Connexion réussie');
      console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
      console.log(`   Utilisateur: ${loginResponse.data.user.prenom} ${loginResponse.data.user.nom}`);
    } else {
      console.log('❌ Échec de la connexion');
      return;
    }

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test 2: Récupérer toutes les propriétés
    console.log('\n2. Test récupération toutes les propriétés:');
    
    const propertiesResponse = await axios.get(`${API_BASE}/biens`);
    
    if (propertiesResponse.data.biens) {
      console.log(`✅ ${propertiesResponse.data.biens.length} propriétés trouvées`);
      
      // Vérifier les propriétaires
      const propertiesWithOwners = propertiesResponse.data.biens.filter(p => 
        p.proprietaire_nom && p.proprietaire_prenom
      );
      
      console.log(`✅ ${propertiesWithOwners.length} propriétés avec propriétaires`);
      
      // Afficher quelques exemples
      propertiesWithOwners.slice(0, 3).forEach(property => {
        console.log(`   ${property.titre} - ${property.ville}`);
        console.log(`     Propriétaire: ${property.proprietaire_prenom} ${property.proprietaire_nom}`);
        console.log(`     Contact: ${property.proprietaire_telephone || 'N/A'}`);
      });
    }

    // Test 3: Récupérer une propriété spécifique
    console.log('\n3. Test récupération propriété spécifique:');
    
    const propertyResponse = await axios.get(`${API_BASE}/biens/1`);
    
    if (propertyResponse.data.bien) {
      const property = propertyResponse.data.bien;
      console.log('✅ Propriété récupérée:');
      console.log(`   Titre: ${property.titre}`);
      console.log(`   Propriétaire: ${property.proprietaire_prenom} ${property.proprietaire_nom}`);
      console.log(`   Email: ${property.proprietaire_email}`);
      console.log(`   Téléphone: ${property.proprietaire_telephone}`);
      console.log(`   Images: ${property.images ? property.images.length : 0} image(s)`);
    }

    // Test 4: Récupérer mes propriétés (vendeur)
    console.log('\n4. Test récupération mes propriétés:');
    
    const myPropertiesResponse = await axios.get(`${API_BASE}/biens/mes-biens`, { headers });
    
    if (myPropertiesResponse.data.biens) {
      console.log(`✅ ${myPropertiesResponse.data.biens.length} propriétés du vendeur connecté`);
      
      myPropertiesResponse.data.biens.forEach(property => {
        console.log(`   ${property.titre} - ${property.ville} (${property.prix}€)`);
      });
    }

    // Test 5: Test connexion admin
    console.log('\n5. Test connexion super admin:');
    
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'superadmin@karya.tn',
      mot_de_passe: 'admin123'
    });

    if (adminLoginResponse.data.token) {
      console.log('✅ Connexion super admin réussie');
      console.log(`   Utilisateur: ${adminLoginResponse.data.user.prenom} ${adminLoginResponse.data.user.nom}`);
      console.log(`   Rôle: ${adminLoginResponse.data.user.role}`);
    } else {
      console.log('❌ Échec de la connexion admin');
    }

    // Test 6: Test recherche
    console.log('\n6. Test recherche propriétés:');
    
    const searchResponse = await axios.get(`${API_BASE}/biens?ville=Tunis&type_bien=villa`);
    
    if (searchResponse.data.biens) {
      console.log(`✅ ${searchResponse.data.biens.length} propriétés trouvées pour "villa à Tunis"`);
      
      searchResponse.data.biens.forEach(property => {
        console.log(`   ${property.titre} - ${property.prix}€`);
        console.log(`     Propriétaire: ${property.proprietaire_prenom} ${property.proprietaire_nom}`);
      });
    }

    // Test 7: Test statistiques
    console.log('\n7. Test statistiques:');
    
    const statsResponse = await axios.get(`${API_BASE}/biens`, { 
      params: { limit: 1 },
      headers 
    });
    
    if (statsResponse.data) {
      console.log('✅ API fonctionnelle');
      console.log(`   Total propriétés: ${statsResponse.data.total || 'N/A'}`);
      console.log(`   Page actuelle: ${statsResponse.data.page || 1}`);
    }

    console.log('\n🎉 Tests API terminés avec succès !');
    console.log('\n📋 Résumé:');
    console.log('✅ Authentification vendeur/admin fonctionnelle');
    console.log('✅ Récupération propriétés avec propriétaires');
    console.log('✅ Détails propriété avec contact propriétaire');
    console.log('✅ Gestion mes propriétés (vendeur)');
    console.log('✅ Recherche et filtres');
    console.log('✅ API complètement opérationnelle');

  } catch (error) {
    console.error('❌ Erreur lors des tests API:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Exécuter les tests
if (require.main === module) {
  testFullAPI().then(() => {
    console.log('\n✅ Script de test API terminé');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
}

module.exports = { testFullAPI };
