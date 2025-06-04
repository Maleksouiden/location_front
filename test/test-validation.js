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

// Tests de validation spécifiques
async function runValidationTests() {
  console.log('🔍 TESTS DE VALIDATION DES CAS D\'ERREUR\n');

  let results = { passed: 0, failed: 0 };
  let tokens = {};

  // Fonction helper pour les tests
  async function test(name, testFn) {
    try {
      const result = await testFn();
      if (result.success) {
        console.log(`✅ ${name}: ${result.message}`);
        results.passed++;
      } else {
        console.log(`❌ ${name}: ${result.message}`);
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${name}: Erreur - ${error.message}`);
      results.failed++;
    }
  }

  // Obtenir les tokens d'abord
  console.log('🔐 Obtention des tokens...');
  
  // Token acheteur
  const acheteurLogin = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'leila.bouazizi@email.com',
    mot_de_passe: 'password123'
  });
  
  if (acheteurLogin.status === 200) {
    tokens.acheteur = acheteurLogin.data.token;
    console.log('✅ Token acheteur obtenu');
  }

  // Token vendeur
  const vendeurLogin = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'mohamed.benali@email.com',
    mot_de_passe: 'password123'
  });
  
  if (vendeurLogin.status === 200) {
    tokens.vendeur = vendeurLogin.data.token;
    console.log('✅ Token vendeur obtenu');
  }

  // Token admin
  const adminLogin = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'admin@karya.tn',
    mot_de_passe: 'password123'
  });
  
  if (adminLogin.status === 200) {
    tokens.admin = adminLogin.data.token;
    console.log('✅ Token admin obtenu');
  }

  console.log('\n📝 TESTS DE VALIDATION\n');

  // 1. Tests d'authentification - Cas d'erreur
  console.log('🔐 TESTS D\'AUTHENTIFICATION - CAS D\'ERREUR');

  await test('Register - Email déjà existant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      nom: 'Test',
      prenom: 'Duplicate',
      email: 'leila.bouazizi@email.com', // Email existant
      mot_de_passe: 'password123',
      role: 'acheteur'
    });

    if (response.status === 409 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 409, got ${response.status}` };
  });

  await test('Register - Mot de passe trop court', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      nom: 'Test',
      prenom: 'Short',
      email: 'test.short@example.com',
      mot_de_passe: '123', // Trop court
      role: 'acheteur'
    });

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 400, got ${response.status}` };
  });

  await test('Login - Email inexistant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'inexistant@example.com',
      mot_de_passe: 'password123'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 401, got ${response.status}` };
  });

  await test('Login - Mot de passe incorrect', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'leila.bouazizi@email.com',
      mot_de_passe: 'wrongpassword'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 401, got ${response.status}` };
  });

  await test('Profile - Token manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/utilisateurs/me',
      method: 'GET'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 401, got ${response.status}` };
  });

  await test('Profile - Token invalide', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/utilisateurs/me',
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid_token_here' }
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 403, got ${response.status}` };
  });

  // 2. Tests des biens - Cas d'erreur
  console.log('\n🏠 TESTS DES BIENS - CAS D\'ERREUR');

  await test('Get Bien - ID inexistant', async () => {
    // Utiliser un ID très élevé qui n'existe certainement pas
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens/999999999',
      method: 'GET'
    });

    if (response.status === 404 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 404, got ${response.status}` };
  });

  await test('Get Bien - ID invalide (texte)', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens/abc',
      method: 'GET'
    });

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 400, got ${response.status}` };
  });

  await test('Get Bien - ID négatif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens/-1',
      method: 'GET'
    });

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 400, got ${response.status}` };
  });

  await test('Create Bien - Token manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      titre: 'Test sans token',
      description: 'Test',
      type_bien: 'appartement',
      statut: 'location',
      prix: 1000
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 401, got ${response.status}` };
  });

  await test('Create Bien - Rôle acheteur (interdit)', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${tokens.acheteur}`,
        'Content-Type': 'application/json'
      }
    }, {
      titre: 'Test acheteur',
      description: 'Test avec rôle acheteur',
      type_bien: 'appartement',
      statut: 'location',
      prix: 1000,
      modalite_paiement: 'mensuel',
      surface: 80,
      nombre_pieces: 3,
      adresse_complete: 'Test',
      ville: 'Test',
      code_postal: '1000',
      latitude: 36.8,
      longitude: 10.1
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 403, got ${response.status}` };
  });

  // 3. Tests des conversations - Cas d'erreur
  console.log('\n💬 TESTS DES CONVERSATIONS - CAS D\'ERREUR');

  await test('Get Conversations - Token manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/conversations',
      method: 'GET'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 401, got ${response.status}` };
  });

  await test('Create Conversation - Bien inexistant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/conversations',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${tokens.acheteur}`,
        'Content-Type': 'application/json'
      }
    }, {
      bien_id: 99999,
      contenu_initial: 'Test bien inexistant'
    });

    if (response.status === 404 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 404, got ${response.status}` };
  });

  // 4. Tests d'administration - Cas d'erreur
  console.log('\n👨‍💼 TESTS D\'ADMINISTRATION - CAS D\'ERREUR');

  await test('Admin Users - Rôle non admin', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/utilisateurs',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 403, got ${response.status}` };
  });

  await test('Admin Dashboard - Token manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/dashboard',
      method: 'GET'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status ${response.status} - ${response.data.error}` };
    }
    return { success: false, message: `Expected 401, got ${response.status}` };
  });

  // Résumé
  console.log('\n📊 RÉSUMÉ DES TESTS DE VALIDATION');
  console.log('='.repeat(40));
  console.log(`✅ Tests réussis: ${results.passed}`);
  console.log(`❌ Tests échoués: ${results.failed}`);
  console.log(`📈 Taux de réussite: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 TOUS LES TESTS DE VALIDATION SONT PASSÉS !');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) de validation ont échoué`);
  }
}

// Exécuter les tests
runValidationTests().catch(console.error);
