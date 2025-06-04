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

async function testAPI() {
  console.log('🧪 Test de l\'API Karya.tn...\n');

  try {
    // 1. Test de santé
    console.log('1. Test de santé de l\'API...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    console.log('✅ Santé:', healthResponse.data);

    // 2. Test d'inscription
    console.log('\n2. Test d\'inscription...');
    const registerData = {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@test.com',
      mot_de_passe: 'password123',
      role: 'acheteur',
      telephone: '+216 20 123 456'
    };

    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, registerData);
    
    console.log('✅ Inscription:', registerResponse.status, registerResponse.data.message || registerResponse.data.error);
    
    let token = null;
    if (registerResponse.status === 201) {
      token = registerResponse.data.token;
      console.log('🔑 Token reçu');
    }

    // 3. Test de connexion avec un compte existant
    console.log('\n3. Test de connexion...');
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
    
    console.log('✅ Connexion:', loginResponse.status, loginResponse.data.message || loginResponse.data.error);
    
    if (loginResponse.status === 200) {
      token = loginResponse.data.token;
      console.log('🔑 Token de connexion reçu');
    }

    // 4. Test récupération du profil
    if (token) {
      console.log('\n4. Test récupération profil...');
      const profileResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/utilisateurs/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Profil:', profileResponse.status);
      if (profileResponse.data.user) {
        console.log('👤 Utilisateur:', profileResponse.data.user.nom, profileResponse.data.user.prenom);
      }
    }

    // 5. Test récupération des biens
    console.log('\n5. Test récupération des biens...');
    const biensResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/biens',
      method: 'GET'
    });
    
    console.log('✅ Biens:', biensResponse.status);
    if (biensResponse.data.biens) {
      console.log('🏠 Nombre de biens:', biensResponse.data.biens.length);
      if (biensResponse.data.biens.length > 0) {
        console.log('🏠 Premier bien:', biensResponse.data.biens[0].titre);
      }
    }

    // 6. Test récupération d'un bien spécifique
    if (biensResponse.data.biens && biensResponse.data.biens.length > 0) {
      const bienId = biensResponse.data.biens[0].id;
      console.log('\n6. Test récupération bien spécifique...');
      const bienResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/biens/${bienId}`,
        method: 'GET'
      });
      
      console.log('✅ Bien spécifique:', bienResponse.status);
      if (bienResponse.data.bien) {
        console.log('🏠 Bien:', bienResponse.data.bien.titre);
        console.log('💰 Prix:', bienResponse.data.bien.prix, 'TND');
        console.log('📍 Ville:', bienResponse.data.bien.ville);
      }
    }

    // 7. Test avec un vendeur
    console.log('\n7. Test connexion vendeur...');
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
    
    console.log('✅ Connexion vendeur:', vendeurLoginResponse.status);
    
    if (vendeurLoginResponse.status === 200) {
      const vendeurToken = vendeurLoginResponse.data.token;
      
      // Test récupération des biens du vendeur
      console.log('\n8. Test biens du vendeur...');
      const mesBiensResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/biens/mes-biens',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${vendeurToken}`
        }
      });
      
      console.log('✅ Mes biens:', mesBiensResponse.status);
      if (mesBiensResponse.data.biens) {
        console.log('🏠 Nombre de mes biens:', mesBiensResponse.data.biens.length);
      }
    }

    console.log('\n🎉 Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testAPI();
