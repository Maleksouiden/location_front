const { spawn } = require('child_process');
const http = require('http');

// Fonction pour attendre que le serveur soit prêt
async function waitForServer(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3000,
          path: '/api/health',
          method: 'GET'
        }, (res) => {
          resolve({ status: res.statusCode });
        });
        req.on('error', reject);
        req.end();
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

async function runTestsWithServer() {
  console.log('🚀 DÉMARRAGE DES TESTS AVEC SERVEUR AUTOMATIQUE\n');

  // Démarrer le serveur
  console.log('📡 Démarrage du serveur...');
  const serverProcess = spawn('node', ['start-server.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let serverOutput = '';
  serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
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

  console.log('✅ Serveur prêt !\n');

  try {
    // Exécuter les tests rapides
    console.log('🧪 Exécution des tests...\n');
    
    const testProcess = spawn('node', ['test/test-quick.js'], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    await new Promise((resolve) => {
      testProcess.on('close', (code) => {
        resolve(code);
      });
    });

    console.log('\n📋 INFORMATIONS SUPPLÉMENTAIRES');
    console.log('='.repeat(40));
    console.log('🌐 Serveur: http://localhost:3000');
    console.log('📚 Documentation: http://localhost:3000');
    console.log('🏥 Santé API: http://localhost:3000/api/health');
    
    console.log('\n👥 COMPTES DE TEST DISPONIBLES:');
    console.log('👨‍💼 Admin: admin@karya.tn / password123');
    console.log('🏪 Vendeur: mohamed.benali@email.com / password123');
    console.log('🛒 Acheteur: leila.bouazizi@email.com / password123');

    console.log('\n🔧 ENDPOINTS PRINCIPAUX:');
    console.log('POST /api/auth/login - Connexion');
    console.log('GET /api/biens - Liste des biens');
    console.log('GET /api/utilisateurs/me - Profil utilisateur');
    console.log('GET /api/conversations - Conversations');
    console.log('GET /api/admin/dashboard - Dashboard admin');

    console.log('\n💡 POUR TESTER MANUELLEMENT:');
    console.log('curl http://localhost:3000/api/health');
    console.log('curl -X POST http://localhost:3000/api/auth/login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email":"leila.bouazizi@email.com","mot_de_passe":"password123"}\'');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  } finally {
    console.log('\n🛑 Arrêt du serveur...');
    serverProcess.kill();
    
    // Attendre un peu pour que le serveur s'arrête proprement
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Tests terminés !');
  }
}

// Exécuter les tests
runTestsWithServer().catch(console.error);
