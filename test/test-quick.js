const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';

// Fonction pour faire des requêtes HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Tests rapides
async function runQuickTests() {
  console.log('🚀 TESTS RAPIDES DE L\'API KARYA.TN\n');

  let tokens = {};
  let testData = {};
  let passed = 0;
  let failed = 0;

  // Test 1: Santé de l'API
  console.log('1. 🏥 Test de santé...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('   ✅ API en ligne');
      passed++;
    } else {
      console.log('   ❌ API hors ligne');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 2: Connexion acheteur
  console.log('\n2. 🔐 Connexion acheteur...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'leila.bouazizi@email.com',
      mot_de_passe: 'password123'
    });
    
    if (response.status === 200 && response.data.token) {
      tokens.acheteur = response.data.token;
      console.log('   ✅ Connexion réussie');
      passed++;
    } else {
      console.log('   ❌ Échec connexion');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 3: Connexion vendeur
  console.log('\n3. 🏪 Connexion vendeur...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'mohamed.benali@email.com',
      mot_de_passe: 'password123'
    });
    
    if (response.status === 200 && response.data.token) {
      tokens.vendeur = response.data.token;
      console.log('   ✅ Connexion réussie');
      passed++;
    } else {
      console.log('   ❌ Échec connexion');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 4: Connexion admin
  console.log('\n4. 👨‍💼 Connexion admin...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@karya.tn',
      mot_de_passe: 'password123'
    });
    
    if (response.status === 200 && response.data.token) {
      tokens.admin = response.data.token;
      console.log('   ✅ Connexion réussie');
      passed++;
    } else {
      console.log('   ❌ Échec connexion');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 5: Récupération des biens
  console.log('\n5. 🏠 Récupération des biens...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens',
      method: 'GET'
    });
    
    if (response.status === 200 && response.data.biens) {
      console.log(`   ✅ ${response.data.biens.length} biens trouvés`);
      if (response.data.biens.length > 0) {
        testData.bienId = response.data.biens[0].id;
      }
      passed++;
    } else {
      console.log('   ❌ Échec récupération');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 6: Profil utilisateur
  console.log('\n6. 👤 Profil utilisateur...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/utilisateurs/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });
    
    if (response.status === 200 && response.data.user) {
      console.log(`   ✅ Profil: ${response.data.user.nom} ${response.data.user.prenom}`);
      passed++;
    } else {
      console.log('   ❌ Échec récupération profil');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 7: Création d'un bien (vendeur)
  console.log('\n7. 🏗️ Création d\'un bien...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${tokens.vendeur}`,
        'Content-Type': 'application/json'
      }
    }, {
      titre: 'Test API - Appartement',
      description: 'Bien créé automatiquement pour test API',
      type_bien: 'appartement',
      statut: 'location',
      prix: 1200,
      modalite_paiement: 'mensuel',
      surface: 85,
      nombre_pieces: 3,
      adresse_complete: '123 Rue Test API',
      ville: 'Tunis',
      code_postal: '1000',
      latitude: 36.8065,
      longitude: 10.1815
    });
    
    if (response.status === 201 && response.data.bien) {
      console.log(`   ✅ Bien créé: ID ${response.data.bien.id}`);
      passed++;
    } else {
      console.log('   ❌ Échec création bien');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 8: Conversations
  console.log('\n8. 💬 Test conversations...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/conversations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });
    
    if (response.status === 200 && response.data.conversations) {
      console.log(`   ✅ ${response.data.conversations.length} conversations trouvées`);
      passed++;
    } else {
      console.log('   ❌ Échec récupération conversations');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 9: Dashboard admin
  console.log('\n9. 📊 Dashboard admin...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    });
    
    if (response.status === 200 && response.data.dashboard) {
      console.log('   ✅ Dashboard accessible');
      passed++;
    } else {
      console.log('   ❌ Échec dashboard');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 10: Test d'erreur (token invalide)
  console.log('\n10. 🚫 Test d\'erreur...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/utilisateurs/me',
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid_token' }
    });
    
    if (response.status === 403 && response.data.error) {
      console.log('   ✅ Erreur gérée correctement');
      passed++;
    } else {
      console.log('   ❌ Gestion d\'erreur incorrecte');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(30));
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📈 Taux de réussite: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
  } else {
    console.log(`\n⚠️  ${failed} test(s) ont échoué`);
  }

  console.log('\n🌐 API disponible sur: http://localhost:3000');
  console.log('📚 Documentation: http://localhost:3000');
}

// Exécuter les tests
runQuickTests().catch(console.error);
