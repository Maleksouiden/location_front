#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAuth() {
  console.log('🧪 Test de l\'authentification...\n');

  try {
    // Test 1: Login
    console.log('1️⃣ Test de connexion...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'mohamed.benali@email.com',
      mot_de_passe: 'password123'
    });

    console.log('✅ Connexion réussie !');
    console.log('📄 Réponse:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;

    // Test 2: Vérification du token
    console.log('\n2️⃣ Test de vérification du token...');
    const verifyResponse = await axios.post(`${API_BASE}/auth/verify`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Vérification réussie !');
    console.log('📄 Réponse:', JSON.stringify(verifyResponse.data, null, 2));

    // Test 3: Inscription d'un nouvel utilisateur
    console.log('\n3️⃣ Test d\'inscription...');
    const randomEmail = `test${Date.now()}@example.com`;
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      nom: 'Test',
      prenom: 'User',
      email: randomEmail,
      mot_de_passe: 'password123',
      role: 'acheteur'
    });

    console.log('✅ Inscription réussie !');
    console.log('📄 Réponse:', JSON.stringify(registerResponse.data, null, 2));

    console.log('\n🎉 Tous les tests d\'authentification sont passés !');
    console.log('\n📋 Résumé des structures de réponse :');
    console.log('• Login/Register: { message, token, user }');
    console.log('• Verify: { valid, user }');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Test des propriétés
async function testProperties() {
  console.log('\n🏠 Test des propriétés...\n');

  try {
    // Test 1: Récupérer toutes les propriétés
    console.log('1️⃣ Test de récupération des propriétés...');
    const propertiesResponse = await axios.get(`${API_BASE}/biens`);

    console.log('✅ Propriétés récupérées !');
    console.log(`📊 Nombre de propriétés: ${propertiesResponse.data.biens?.length || 0}`);
    
    if (propertiesResponse.data.biens && propertiesResponse.data.biens.length > 0) {
      const firstProperty = propertiesResponse.data.biens[0];
      console.log('🏠 Première propriété:', {
        id: firstProperty.id,
        titre: firstProperty.titre,
        prix: firstProperty.prix,
        ville: firstProperty.ville
      });

      // Test 2: Récupérer une propriété spécifique
      console.log('\n2️⃣ Test de récupération d\'une propriété spécifique...');
      const propertyResponse = await axios.get(`${API_BASE}/biens/${firstProperty.id}`);
      
      console.log('✅ Propriété spécifique récupérée !');
      console.log('🏠 Détails:', {
        id: propertyResponse.data.bien.id,
        titre: propertyResponse.data.bien.titre,
        description: propertyResponse.data.bien.description.substring(0, 100) + '...'
      });
    }

    console.log('\n🎉 Tous les tests de propriétés sont passés !');

  } catch (error) {
    console.error('❌ Erreur lors du test des propriétés:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests de l\'API Karya TN\n');
  console.log('=' .repeat(50));
  
  await testAuth();
  await testProperties();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Tests terminés !');
  console.log('\n💡 Vous pouvez maintenant tester la connexion sur le frontend :');
  console.log('🌐 http://localhost:3001/login');
  console.log('\n👤 Comptes de test :');
  console.log('• Vendeur: mohamed.benali@email.com / password123');
  console.log('• Acheteur: leila.bouazizi@email.com / password123');
  console.log('• Admin: admin@karya.tn / password123');
}

runAllTests();
