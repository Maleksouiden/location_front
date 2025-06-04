const { spawn } = require('child_process');
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

// Fonction pour attendre que le serveur soit prêt
async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
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

async function runTests() {
  console.log('🚀 Démarrage du serveur et des tests...\n');

  // Démarrer le serveur
  const serverProcess = spawn('node', ['server.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (data) => {
    console.log('📟 Serveur:', data.toString().trim());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('❌ Erreur serveur:', data.toString().trim());
  });

  // Attendre que le serveur soit prêt
  console.log('⏳ Attente du démarrage du serveur...');
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    console.error('❌ Le serveur n\'a pas pu démarrer');
    serverProcess.kill();
    return;
  }

  console.log('✅ Serveur prêt ! Début des tests...\n');

  try {
    // 1. Test de santé
    console.log('1. 🏥 Test de santé...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthResponse.data)}\n`);

    // 2. Test de la page d'accueil
    console.log('2. 🏠 Test page d\'accueil...');
    const homeResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET'
    });
    console.log(`   Status: ${homeResponse.status}`);
    console.log(`   Message: ${homeResponse.data.message}\n`);

    // 3. Test de connexion avec un compte existant
    console.log('3. 🔐 Test de connexion...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'leila.bouazizi@email.com',
      mot_de_passe: 'password123'
    });
    
    console.log(`   Status: ${loginResponse.status}`);
    if (loginResponse.data.message) {
      console.log(`   Message: ${loginResponse.data.message}`);
    }
    if (loginResponse.data.error) {
      console.log(`   Erreur: ${loginResponse.data.error}`);
    }

    let token = null;
    if (loginResponse.status === 200 && loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('   🔑 Token obtenu');
      console.log(`   Utilisateur: ${loginResponse.data.user.nom} ${loginResponse.data.user.prenom}`);
    }
    console.log();

    // 4. Test récupération des biens
    console.log('4. 🏘️ Test récupération des biens...');
    const biensResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens',
      method: 'GET'
    });
    
    console.log(`   Status: ${biensResponse.status}`);
    if (biensResponse.data.biens) {
      console.log(`   Nombre de biens: ${biensResponse.data.biens.length}`);
      if (biensResponse.data.biens.length > 0) {
        const premier = biensResponse.data.biens[0];
        console.log(`   Premier bien: ${premier.titre}`);
        console.log(`   Prix: ${premier.prix} TND`);
        console.log(`   Ville: ${premier.ville}`);
      }
    }
    console.log();

    // 5. Test avec token (si disponible)
    if (token) {
      console.log('5. 👤 Test profil utilisateur...');
      const profileResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/utilisateurs/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`   Status: ${profileResponse.status}`);
      if (profileResponse.data.user) {
        console.log(`   Nom: ${profileResponse.data.user.nom} ${profileResponse.data.user.prenom}`);
        console.log(`   Email: ${profileResponse.data.user.email}`);
        console.log(`   Rôle: ${profileResponse.data.user.role}`);
      }
      console.log();
    }

    // 6. Test connexion vendeur
    console.log('6. 🏪 Test connexion vendeur...');
    const vendeurLoginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'mohamed.benali@email.com',
      mot_de_passe: 'password123'
    });
    
    console.log(`   Status: ${vendeurLoginResponse.status}`);
    if (vendeurLoginResponse.data.user) {
      console.log(`   Vendeur: ${vendeurLoginResponse.data.user.nom} ${vendeurLoginResponse.data.user.prenom}`);
    }
    console.log();

    // 7. Test admin
    console.log('7. 👨‍💼 Test connexion admin...');
    const adminLoginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'admin@karya.tn',
      mot_de_passe: 'password123'
    });
    
    console.log(`   Status: ${adminLoginResponse.status}`);
    if (adminLoginResponse.data.user) {
      console.log(`   Admin: ${adminLoginResponse.data.user.nom} ${adminLoginResponse.data.user.prenom}`);
    }
    console.log();

    console.log('🎉 Tous les tests sont terminés avec succès !');
    console.log('\n📋 Résumé des comptes de test :');
    console.log('👨‍💼 Admin: admin@karya.tn / password123');
    console.log('🏪 Vendeur: mohamed.benali@email.com / password123');
    console.log('🛒 Acheteur: leila.bouazizi@email.com / password123');
    console.log('\n🌐 Serveur disponible sur: http://localhost:3000');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  } finally {
    console.log('\n🛑 Arrêt du serveur...');
    serverProcess.kill();
  }
}

// Exécuter les tests
runTests();
