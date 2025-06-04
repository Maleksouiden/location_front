const http = require('http');

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

async function testFixes() {
  console.log('🔧 TEST DES CORRECTIONS\n');

  let passed = 0;
  let failed = 0;

  // Test 1: ID invalide (texte)
  console.log('1. Test ID invalide (texte)...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens/abc',
      method: 'GET'
    });
    
    if (response.status === 400 && response.data.error === 'ID invalide') {
      console.log('   ✅ Correction validée - Status 400');
      passed++;
    } else {
      console.log(`   ❌ Échec - Status: ${response.status}, Expected: 400`);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 2: ID négatif
  console.log('\n2. Test ID négatif...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens/-1',
      method: 'GET'
    });
    
    if (response.status === 400 && response.data.error === 'ID invalide') {
      console.log('   ✅ Correction validée - Status 400');
      passed++;
    } else {
      console.log(`   ❌ Échec - Status: ${response.status}, Expected: 400`);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 3: ID inexistant (très grand nombre)
  console.log('\n3. Test ID inexistant...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens/999999999',
      method: 'GET'
    });
    
    if (response.status === 404 && response.data.error === 'Bien non trouvé') {
      console.log('   ✅ Correction validée - Status 404');
      passed++;
    } else {
      console.log(`   ❌ Échec - Status: ${response.status}, Expected: 404`);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 4: Validation des prix négatifs
  console.log('\n4. Test prix négatif...');
  try {
    // D'abord obtenir un token vendeur
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'mohamed.benali@email.com',
      mot_de_passe: 'password123'
    });

    if (loginResponse.status === 200) {
      const token = loginResponse.data.token;
      
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/biens',
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, {
        titre: 'Test prix négatif',
        description: 'Test avec prix négatif pour validation',
        type_bien: 'appartement',
        statut: 'location',
        prix: -100, // Prix négatif
        modalite_paiement: 'mensuel',
        surface: 80,
        nombre_pieces: 3,
        adresse_complete: 'Test Address',
        ville: 'Test',
        code_postal: '1000',
        latitude: 36.8,
        longitude: 10.1
      });
      
      if (response.status === 400 && response.data.error === 'Données invalides') {
        console.log('   ✅ Correction validée - Prix négatif rejeté');
        passed++;
      } else {
        console.log(`   ❌ Échec - Status: ${response.status}, Expected: 400`);
        failed++;
      }
    } else {
      console.log('   ❌ Échec connexion vendeur');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Test 5: Validation des budgets incohérents
  console.log('\n5. Test budgets incohérents...');
  try {
    // D'abord obtenir un token acheteur
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'leila.bouazizi@email.com',
      mot_de_passe: 'password123'
    });

    if (loginResponse.status === 200) {
      const token = loginResponse.data.token;
      
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/preferences',
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, {
        statut_recherche: 'location',
        budget_min: 2000,
        budget_max: 1000 // Min > Max
      });
      
      if (response.status === 400 && response.data.error === 'Budgets incohérents') {
        console.log('   ✅ Correction validée - Budgets incohérents rejetés');
        passed++;
      } else {
        console.log(`   ❌ Échec - Status: ${response.status}, Expected: 400`);
        failed++;
      }
    } else {
      console.log('   ❌ Échec connexion acheteur');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    failed++;
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ DES TESTS DE CORRECTIONS');
  console.log('='.repeat(40));
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📈 Taux de réussite: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 TOUTES LES CORRECTIONS FONCTIONNENT !');
  } else {
    console.log(`\n⚠️  ${failed} correction(s) à revoir`);
  }
}

// Exécuter les tests
testFixes().catch(console.error);
