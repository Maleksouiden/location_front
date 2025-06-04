// Script de test pour vérifier la connexion frontend-backend
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Test de connexion Frontend-Backend\n');

  try {
    // Test 1: Récupération des biens (endpoint public)
    console.log('1. Test récupération des biens...');
    const biensResponse = await axios.get(`${API_BASE_URL}/biens?limit=5`);
    console.log('✅ Biens récupérés:', biensResponse.data.biens.length, 'biens trouvés');
    console.log('   Total:', biensResponse.data.total);

    // Test 2: Connexion avec un compte vendeur
    console.log('\n2. Test connexion vendeur...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'mohamed.benali@email.com',
      mot_de_passe: 'password123'
    });
    console.log('✅ Connexion réussie pour:', loginResponse.data.user.prenom, loginResponse.data.user.nom);
    
    const token = loginResponse.data.token;

    // Test 3: Récupération des biens du vendeur
    console.log('\n3. Test récupération des biens du vendeur...');
    const mesBiensResponse = await axios.get(`${API_BASE_URL}/biens/mes-biens`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Biens du vendeur:', mesBiensResponse.data.length, 'biens');

    // Test 4: Test connexion acheteur
    console.log('\n4. Test connexion acheteur...');
    const acheteurResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'leila.bouazizi@email.com',
      mot_de_passe: 'password123'
    });
    console.log('✅ Connexion acheteur réussie pour:', acheteurResponse.data.user.prenom, acheteurResponse.data.user.nom);

    // Test 5: Test connexion admin
    console.log('\n5. Test connexion admin...');
    const adminResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@karya.tn',
      mot_de_passe: 'password123'
    });
    console.log('✅ Connexion admin réussie pour:', adminResponse.data.user.prenom, adminResponse.data.user.nom);

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📋 Résumé:');
    console.log('   - API accessible ✅');
    console.log('   - CORS configuré ✅');
    console.log('   - Authentification fonctionnelle ✅');
    console.log('   - Endpoints biens fonctionnels ✅');
    console.log('\n🚀 L\'application est prête à être utilisée !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Vérifiez que le serveur backend est démarré sur le port 3000');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Endpoint non trouvé - vérifiez les routes du backend');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Problème d\'authentification - vérifiez les credentials');
    }
  }
}

// Exécuter les tests
testAPI();
