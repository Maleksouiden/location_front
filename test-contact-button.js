#!/usr/bin/env node
/**
 * Test rapide du bouton Contact
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testContactButton() {
  try {
    console.log('🧪 Test du bouton Contact...\n');
    
    // 1. Se connecter comme acheteur
    console.log('🔑 Connexion acheteur...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'acheteur@test.com',
      mot_de_passe: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Acheteur connecté');
    
    // 2. Récupérer un bien
    console.log('🏠 Récupération d\'un bien...');
    const biensResponse = await axios.get(`${API_BASE}/biens?limit=1`);
    if (biensResponse.data.biens.length === 0) {
      throw new Error('Aucun bien trouvé');
    }
    const bien = biensResponse.data.biens[0];
    console.log(`✅ Bien trouvé: ${bien.titre} (ID: ${bien.id})`);
    
    // 3. Créer une conversation (simuler le clic sur Contact)
    console.log('💬 Création de conversation...');
    const conversationResponse = await axios.post(`${API_BASE}/conversations`, {
      bien_id: bien.id,
      contenu_initial: 'Bonjour, je suis intéressé par votre bien.'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const conversationId = conversationResponse.data.conversation_id;
    console.log(`✅ Conversation créée avec ID: ${conversationId}`);
    
    // 4. Tester l'accès aux messages de cette conversation
    console.log('📨 Test accès aux messages...');
    const messagesResponse = await axios.get(`${API_BASE}/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Messages récupérés:', messagesResponse.data.messages.length);
    console.log('✅ Conversation data:', messagesResponse.data.conversation ? 'OK' : 'MANQUANTE');
    
    // 5. Tester l'envoi d'un message
    console.log('📝 Test envoi message...');
    const messageResponse = await axios.post(`${API_BASE}/conversations/${conversationId}/messages`, {
      contenu: 'Test message depuis le script'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Message envoyé:', messageResponse.data.nouveau_message.contenu);
    
    console.log('\n🎉 === TOUS LES TESTS RÉUSSIS ===');
    console.log(`✅ Conversation ID: ${conversationId}`);
    console.log('✅ Le bouton Contact devrait fonctionner !');
    console.log(`🌐 URL à tester: http://localhost:3001/messages/${conversationId}`);
    
  } catch (error) {
    console.error('\n💥 === ÉCHEC DU TEST ===');
    console.error('Erreur:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⏰ Rate limiting actif. Attendez quelques minutes et réessayez.');
    }
  }
}

testContactButton();
