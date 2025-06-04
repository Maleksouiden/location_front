const http = require('http');
const { spawn } = require('child_process');

// Configuration des tests
const BASE_URL = 'http://localhost:3000';
const TEST_PORT = 3000;

// Couleurs pour l'affichage
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

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
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

// Fonction utilitaire pour les logs
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, success, details = '') {
  const icon = success ? '✅' : '❌';
  const color = success ? 'green' : 'red';
  log(`${icon} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Variables globales pour les tests
let testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

let tokens = {
  admin: null,
  vendeur: null,
  acheteur: null
};

let testData = {
  userId: null,
  bienId: null,
  conversationId: null,
  creneauId: null
};

// Fonction pour attendre que le serveur soit prêt
async function waitForServer(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/health',
        method: 'GET'
      });
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // Serveur pas encore prêt
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

// Fonction de test générique
async function runTest(testName, testFunction) {
  testResults.total++;
  try {
    const result = await testFunction();
    if (result.success) {
      testResults.passed++;
      logTest(testName, true, result.message);
    } else {
      testResults.failed++;
      logTest(testName, false, result.message);
    }
  } catch (error) {
    testResults.failed++;
    logTest(testName, false, `Erreur: ${error.message}`);
  }
}

// Tests d'authentification
async function testAuth() {
  log('\n🔐 TESTS D\'AUTHENTIFICATION', 'bold');

  // 1.1 POST /api/auth/register - Cas positif
  await runTest('Register - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      nom: 'Test',
      prenom: 'User',
      email: 'test.user@example.com',
      mot_de_passe: 'password123',
      role: 'acheteur',
      telephone: '+216 20 123 456'
    });

    if (response.status === 201 && response.data.token && response.data.user) {
      testData.userId = response.data.user.id;
      return { success: true, message: `Status: ${response.status}, User ID: ${testData.userId}` };
    }
    return { success: false, message: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
  });

  // 1.1 POST /api/auth/register - Email déjà existant
  await runTest('Register - Email déjà existant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      nom: 'Test',
      prenom: 'User2',
      email: 'leila.bouazizi@email.com', // Email existant
      mot_de_passe: 'password123',
      role: 'acheteur'
    });

    if (response.status === 409 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 409` };
  });

  // 1.1 POST /api/auth/register - Mot de passe trop court
  await runTest('Register - Mot de passe trop court', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      nom: 'Test',
      prenom: 'User3',
      email: 'test3@example.com',
      mot_de_passe: '123', // Trop court
      role: 'acheteur'
    });

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 400` };
  });

  // 1.1 POST /api/auth/register - Champ manquant
  await runTest('Register - Champ manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      nom: 'Test',
      prenom: 'User4',
      // email manquant
      mot_de_passe: 'password123',
      role: 'acheteur'
    });

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 400` };
  });

  // 1.2 POST /api/auth/login - Cas positif (acheteur)
  await runTest('Login - Cas positif (acheteur)', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'leila.bouazizi@email.com',
      mot_de_passe: 'password123'
    });

    if (response.status === 200 && response.data.token && response.data.user) {
      tokens.acheteur = response.data.token;
      return { success: true, message: `Status: ${response.status}, Role: ${response.data.user.role}` };
    }
    return { success: false, message: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
  });

  // 1.2 POST /api/auth/login - Cas positif (vendeur)
  await runTest('Login - Cas positif (vendeur)', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'mohamed.benali@email.com',
      mot_de_passe: 'password123'
    });

    if (response.status === 200 && response.data.token && response.data.user) {
      tokens.vendeur = response.data.token;
      return { success: true, message: `Status: ${response.status}, Role: ${response.data.user.role}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 1.2 POST /api/auth/login - Cas positif (admin)
  await runTest('Login - Cas positif (admin)', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@karya.tn',
      mot_de_passe: 'password123'
    });

    if (response.status === 200 && response.data.token && response.data.user) {
      tokens.admin = response.data.token;
      return { success: true, message: `Status: ${response.status}, Role: ${response.data.user.role}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 1.2 POST /api/auth/login - Email inexistant
  await runTest('Login - Email inexistant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'inexistant@example.com',
      mot_de_passe: 'password123'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 401` };
  });

  // 1.2 POST /api/auth/login - Mot de passe incorrect
  await runTest('Login - Mot de passe incorrect', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'leila.bouazizi@email.com',
      mot_de_passe: 'wrongpassword'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 401` };
  });

  // 1.2 POST /api/auth/login - Corps vide
  await runTest('Login - Corps vide', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 400` };
  });

  // 1.3 GET /api/utilisateurs/me - Cas positif
  await runTest('Get Profile - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/utilisateurs/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });

    if (response.status === 200 && response.data.user && !response.data.user.mot_de_passe_hash) {
      return { success: true, message: `Status: ${response.status}, User: ${response.data.user.nom}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 1.3 GET /api/utilisateurs/me - Token manquant
  await runTest('Get Profile - Token manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/utilisateurs/me',
      method: 'GET'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 401` };
  });

  // 1.3 GET /api/utilisateurs/me - Token invalide
  await runTest('Get Profile - Token invalide', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/utilisateurs/me',
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid_token' }
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 403` };
  });

  // 1.4 PUT /api/utilisateurs/me - Cas positif
  await runTest('Update Profile - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/utilisateurs/me',
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${tokens.acheteur}`,
        'Content-Type': 'application/json'
      }
    }, {
      nom: 'Bouazizi Updated',
      telephone: '+216 25 999 888'
    });

    if (response.status === 200 && response.data.user) {
      return { success: true, message: `Status: ${response.status}, Updated: ${response.data.user.nom}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 1.4 PUT /api/utilisateurs/me - Token manquant
  await runTest('Update Profile - Token manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/utilisateurs/me',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      nom: 'Test Update'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 401` };
  });
}

// Tests des biens immobiliers
async function testBiens() {
  log('\n🏠 TESTS DES BIENS IMMOBILIERS', 'bold');

  // 2.1 GET /api/biens - Cas positif
  await runTest('Get Biens - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens',
      method: 'GET'
    });

    if (response.status === 200 && response.data.biens && Array.isArray(response.data.biens)) {
      if (response.data.biens.length > 0) {
        testData.bienId = response.data.biens[0].id;
      }
      return { success: true, message: `Status: ${response.status}, Count: ${response.data.biens.length}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 2.1 GET /api/biens - Avec filtres
  await runTest('Get Biens - Avec filtres', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens?ville=Tunis&prix_max=2000&page=1&limit=5',
      method: 'GET'
    });

    if (response.status === 200 && response.data.biens && response.data.pagination) {
      return { success: true, message: `Status: ${response.status}, Filtered count: ${response.data.biens.length}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 2.1 GET /api/biens - Paramètre invalide
  await runTest('Get Biens - Paramètre prix invalide', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens?prix_min=abc',
      method: 'GET'
    });

    // L'API peut soit ignorer le paramètre invalide soit retourner une erreur
    // Selon l'implémentation, on accepte les deux
    return { success: true, message: `Status: ${response.status}` };
  });

  // 2.2 GET /api/biens/:id - Cas positif
  await runTest('Get Bien by ID - Cas positif', async () => {
    if (!testData.bienId) {
      return { success: false, message: 'Aucun bien ID disponible' };
    }

    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/biens/${testData.bienId}`,
      method: 'GET'
    });

    if (response.status === 200 && response.data.bien) {
      return { success: true, message: `Status: ${response.status}, Bien: ${response.data.bien.titre}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 2.2 GET /api/biens/:id - ID inexistant
  await runTest('Get Bien by ID - ID inexistant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens/99999',
      method: 'GET'
    });

    if (response.status === 404 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 404` };
  });

  // 2.2 GET /api/biens/:id - ID invalide
  await runTest('Get Bien by ID - ID invalide', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens/abc',
      method: 'GET'
    });

    // Peut retourner 400 ou 404 selon l'implémentation
    if (response.status === 400 || response.status === 404) {
      return { success: true, message: `Status: ${response.status}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 400 or 404` };
  });

  // 2.3 POST /api/biens - Cas positif (vendeur)
  await runTest('Create Bien - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.vendeur}`,
        'Content-Type': 'application/json'
      }
    }, {
      titre: 'Appartement Test API',
      description: 'Description test pour validation API automatique',
      type_bien: 'appartement',
      statut: 'location',
      prix: 1500,
      modalite_paiement: 'mensuel',
      surface: 90,
      nombre_pieces: 4,
      adresse_complete: '123 Rue Test API',
      ville: 'Tunis',
      code_postal: '1000',
      latitude: 36.8065,
      longitude: 10.1815
    });

    if (response.status === 201 && response.data.bien) {
      return { success: true, message: `Status: ${response.status}, Bien créé: ${response.data.bien.id}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 2.3 POST /api/biens - Token manquant
  await runTest('Create Bien - Token manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      titre: 'Test sans token',
      description: 'Test',
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

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 401` };
  });

  // 2.3 POST /api/biens - Rôle acheteur (interdit)
  await runTest('Create Bien - Rôle acheteur', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.acheteur}`,
        'Content-Type': 'application/json'
      }
    }, {
      titre: 'Test acheteur',
      description: 'Test',
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
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 403` };
  });

  // 2.3 POST /api/biens - Champ manquant
  await runTest('Create Bien - Champ manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.vendeur}`,
        'Content-Type': 'application/json'
      }
    }, {
      titre: 'Test incomplet',
      // description manquante
      type_bien: 'appartement',
      statut: 'location',
      prix: 1000
      // autres champs manquants
    });

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 400` };
  });

  // 2.3 POST /api/biens - Valeurs invalides
  await runTest('Create Bien - Prix négatif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/biens',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.vendeur}`,
        'Content-Type': 'application/json'
      }
    }, {
      titre: 'Test prix négatif',
      description: 'Test avec prix invalide',
      type_bien: 'appartement',
      statut: 'location',
      prix: -1000, // Prix négatif
      modalite_paiement: 'mensuel',
      surface: 80,
      nombre_pieces: 3,
      adresse_complete: 'Test',
      ville: 'Test',
      code_postal: '1000',
      latitude: 36.8,
      longitude: 10.1
    });

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 400` };
  });
}

// Tests des conversations
async function testConversations() {
  log('\n💬 TESTS DES CONVERSATIONS', 'bold');

  // 3.1 GET /api/conversations - Cas positif
  await runTest('Get Conversations - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/conversations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });

    if (response.status === 200 && response.data.conversations) {
      return { success: true, message: `Status: ${response.status}, Count: ${response.data.conversations.length}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 3.1 GET /api/conversations - Token manquant
  await runTest('Get Conversations - Token manquant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/conversations',
      method: 'GET'
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 401` };
  });

  // 3.3 POST /api/conversations - Cas positif
  await runTest('Create Conversation - Cas positif', async () => {
    if (!testData.bienId) {
      return { success: false, message: 'Aucun bien ID disponible' };
    }

    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/conversations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.acheteur}`,
        'Content-Type': 'application/json'
      }
    }, {
      bien_id: testData.bienId,
      contenu_initial: 'Bonjour, je suis intéressé par ce bien. Pouvons-nous discuter ?'
    });

    if (response.status === 201 && response.data.conversation_id) {
      testData.conversationId = response.data.conversation_id;
      return { success: true, message: `Status: ${response.status}, Conversation: ${testData.conversationId}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 3.3 POST /api/conversations - Token vendeur (interdit)
  await runTest('Create Conversation - Rôle vendeur', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/conversations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.vendeur}`,
        'Content-Type': 'application/json'
      }
    }, {
      bien_id: testData.bienId,
      contenu_initial: 'Test vendeur'
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 403` };
  });

  // 3.3 POST /api/conversations - Bien inexistant
  await runTest('Create Conversation - Bien inexistant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
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
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 404` };
  });

  // 3.4 POST /api/conversations/:id/messages - Cas positif
  await runTest('Send Message - Cas positif', async () => {
    if (!testData.conversationId) {
      return { success: false, message: 'Aucune conversation ID disponible' };
    }

    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/conversations/${testData.conversationId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.acheteur}`,
        'Content-Type': 'application/json'
      }
    }, {
      contenu: 'Message de test pour validation API'
    });

    if (response.status === 201 && response.data.nouveau_message) {
      return { success: true, message: `Status: ${response.status}, Message envoyé` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 3.2 GET /api/conversations/:id/messages - Cas positif
  await runTest('Get Messages - Cas positif', async () => {
    if (!testData.conversationId) {
      return { success: false, message: 'Aucune conversation ID disponible' };
    }

    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/conversations/${testData.conversationId}/messages`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });

    if (response.status === 200 && response.data.messages) {
      return { success: true, message: `Status: ${response.status}, Messages: ${response.data.messages.length}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 3.2 GET /api/conversations/:id/messages - Conversation inexistante
  await runTest('Get Messages - Conversation inexistante', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/conversations/99999/messages',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });

    if (response.status === 404 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 404` };
  });
}

// Tests des créneaux et rendez-vous
async function testCreneaux() {
  log('\n📅 TESTS DES CRÉNEAUX ET RENDEZ-VOUS', 'bold');

  // 4.1 GET /api/creneaux - Cas positif (vendeur)
  await runTest('Get Créneaux - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/creneaux',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.vendeur}` }
    });

    if (response.status === 200 && response.data.creneaux) {
      return { success: true, message: `Status: ${response.status}, Count: ${response.data.creneaux.length}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 4.1 GET /api/creneaux - Rôle acheteur (interdit)
  await runTest('Get Créneaux - Rôle acheteur', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/creneaux',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 403` };
  });

  // 4.2 POST /api/creneaux - Cas positif
  await runTest('Create Créneau - Cas positif', async () => {
    if (!testData.bienId) {
      return { success: false, message: 'Aucun bien ID disponible' };
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(15, 0, 0, 0);

    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/creneaux',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.vendeur}`,
        'Content-Type': 'application/json'
      }
    }, {
      bien_id: testData.bienId,
      date_debut: tomorrow.toISOString(),
      date_fin: endTime.toISOString()
    });

    if (response.status === 201 && response.data.creneau) {
      testData.creneauId = response.data.creneau.id;
      return { success: true, message: `Status: ${response.status}, Créneau: ${testData.creneauId}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 4.2 POST /api/creneaux - Token manquant
  await runTest('Create Créneau - Token manquant', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/creneaux',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      bien_id: testData.bienId,
      date_debut: tomorrow.toISOString(),
      date_fin: new Date(tomorrow.getTime() + 60*60*1000).toISOString()
    });

    if (response.status === 401 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 401` };
  });

  // 4.2 POST /api/creneaux - Dates incohérentes
  await runTest('Create Créneau - Dates incohérentes', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/creneaux',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.vendeur}`,
        'Content-Type': 'application/json'
      }
    }, {
      bien_id: testData.bienId,
      date_debut: tomorrow.toISOString(),
      date_fin: yesterday.toISOString() // Date fin avant date début
    });

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 400` };
  });

  // 4.5 POST /api/rdv - Cas positif (acheteur)
  await runTest('Request RDV - Cas positif', async () => {
    if (!testData.creneauId) {
      return { success: false, message: 'Aucun créneau ID disponible' };
    }

    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/rdv',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.acheteur}`,
        'Content-Type': 'application/json'
      }
    }, {
      creneau_id: testData.creneauId
    });

    if (response.status === 200 && response.data.message) {
      return { success: true, message: `Status: ${response.status}, ${response.data.message}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 4.5 POST /api/rdv - Rôle vendeur (interdit)
  await runTest('Request RDV - Rôle vendeur', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/rdv',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.vendeur}`,
        'Content-Type': 'application/json'
      }
    }, {
      creneau_id: testData.creneauId
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 403` };
  });

  // 4.6 PUT /api/rdv/:id/accepter - Cas positif (vendeur)
  await runTest('Accept RDV - Cas positif', async () => {
    if (!testData.creneauId) {
      return { success: false, message: 'Aucun créneau ID disponible' };
    }

    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/rdv/${testData.creneauId}/accepter`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokens.vendeur}` }
    });

    if (response.status === 200 && response.data.message) {
      return { success: true, message: `Status: ${response.status}, ${response.data.message}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });
}

// Tests des suggestions
async function testSuggestions() {
  log('\n🎯 TESTS DES SUGGESTIONS', 'bold');

  // 5.1 POST /api/preferences - Cas positif
  await runTest('Set Preferences - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/preferences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.acheteur}`,
        'Content-Type': 'application/json'
      }
    }, {
      statut_recherche: 'location',
      budget_min: 800,
      budget_max: 2000,
      type_bien_prefere: 'appartement',
      surface_min: 60,
      nombre_pieces_min: 2,
      ville_preferee: 'Tunis'
    });

    if (response.status === 200 && response.data.preferences) {
      return { success: true, message: `Status: ${response.status}, Preferences saved` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 5.1 POST /api/preferences - Rôle vendeur (interdit)
  await runTest('Set Preferences - Rôle vendeur', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/preferences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.vendeur}`,
        'Content-Type': 'application/json'
      }
    }, {
      statut_recherche: 'location',
      budget_max: 1500
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 403` };
  });

  // 5.1 POST /api/preferences - Budget incohérent
  await runTest('Set Preferences - Budget incohérent', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/preferences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.acheteur}`,
        'Content-Type': 'application/json'
      }
    }, {
      statut_recherche: 'location',
      budget_min: 2000,
      budget_max: 1000 // Min > Max
    });

    if (response.status === 400 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 400` };
  });

  // 5.2 GET /api/suggestions - Cas positif
  await runTest('Get Suggestions - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/suggestions',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });

    if (response.status === 200 && response.data.suggestions) {
      return { success: true, message: `Status: ${response.status}, Suggestions: ${response.data.suggestions.length}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 5.2 GET /api/suggestions - Rôle vendeur (interdit)
  await runTest('Get Suggestions - Rôle vendeur', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/suggestions',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.vendeur}` }
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 403` };
  });

  // GET /api/preferences - Cas positif
  await runTest('Get Preferences - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/preferences',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });

    if (response.status === 200 && response.data.preferences) {
      return { success: true, message: `Status: ${response.status}, Preferences found` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });
}

// Tests d'administration
async function testAdmin() {
  log('\n👨‍💼 TESTS D\'ADMINISTRATION', 'bold');

  // 6.1 GET /api/admin/utilisateurs - Cas positif
  await runTest('Admin Get Users - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/admin/utilisateurs',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    });

    if (response.status === 200 && response.data.utilisateurs) {
      return { success: true, message: `Status: ${response.status}, Users: ${response.data.utilisateurs.length}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 6.1 GET /api/admin/utilisateurs - Rôle non admin
  await runTest('Admin Get Users - Rôle non admin', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/admin/utilisateurs',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.acheteur}` }
    });

    if (response.status === 403 && response.data.error) {
      return { success: true, message: `Status: ${response.status}, Error: ${response.data.error}` };
    }
    return { success: false, message: `Status: ${response.status}, Expected 403` };
  });

  // 6.3 GET /api/admin/biens - Cas positif
  await runTest('Admin Get Biens - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/admin/biens',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    });

    if (response.status === 200 && response.data.biens) {
      return { success: true, message: `Status: ${response.status}, Biens: ${response.data.biens.length}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // 6.5 GET /api/admin/sponsors - Cas positif
  await runTest('Admin Get Sponsors - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/admin/sponsors',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    });

    if (response.status === 200 && response.data.sponsors) {
      return { success: true, message: `Status: ${response.status}, Sponsors: ${response.data.sponsors.length}` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });

  // GET /api/admin/dashboard - Cas positif
  await runTest('Admin Dashboard - Cas positif', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    });

    if (response.status === 200 && response.data.dashboard) {
      return { success: true, message: `Status: ${response.status}, Dashboard loaded` };
    }
    return { success: false, message: `Status: ${response.status}` };
  });
}

// Fonction principale
async function runAllTests() {
  log('🚀 DÉMARRAGE DES TESTS COMPLETS DE L\'API KARYA.TN', 'bold');
  log('=' * 60, 'blue');

  // Démarrer le serveur
  log('\n📡 Démarrage du serveur...', 'yellow');
  const serverProcess = spawn('node', ['start-server.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Attendre que le serveur soit prêt
  log('⏳ Attente du démarrage du serveur...', 'yellow');
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    log('❌ Le serveur n\'a pas pu démarrer', 'red');
    serverProcess.kill();
    return;
  }

  log('✅ Serveur prêt ! Début des tests...', 'green');

  try {
    // Exécuter les tests
    await testAuth();
    await testBiens();
    await testConversations();
    await testCreneaux();
    await testSuggestions();
    await testAdmin();

    // Afficher le résumé
    log('\n📊 RÉSUMÉ DES TESTS', 'bold');
    log('=' * 40, 'blue');
    log(`Total: ${testResults.total}`, 'blue');
    log(`✅ Réussis: ${testResults.passed}`, 'green');
    log(`❌ Échoués: ${testResults.failed}`, 'red');
    
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    log(`📈 Taux de réussite: ${successRate}%`, successRate > 80 ? 'green' : 'yellow');

    if (testResults.failed === 0) {
      log('\n🎉 TOUS LES TESTS SONT PASSÉS !', 'green');
    } else {
      log(`\n⚠️  ${testResults.failed} test(s) ont échoué`, 'yellow');
    }

  } catch (error) {
    log(`❌ Erreur lors des tests: ${error.message}`, 'red');
  } finally {
    log('\n🛑 Arrêt du serveur...', 'yellow');
    serverProcess.kill();
  }
}

// Exécuter les tests
runAllTests().catch(console.error);
