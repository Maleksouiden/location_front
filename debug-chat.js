#!/usr/bin/env node
/**
 * Script de debug pour le système de chat
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function debugChat() {
  try {
    console.log('🔍 === DEBUG DU SYSTÈME DE CHAT ===\n');
    
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
    console.log(`   Propriétaire ID: ${bien.proprietaire_id}`);
    
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
    
    // 4. Récupérer les messages de cette conversation
    console.log('📨 Récupération des messages...');
    const messagesResponse = await axios.get(`${API_BASE}/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Données de conversation:', JSON.stringify(messagesResponse.data.conversation, null, 2));
    console.log('📋 Messages:', JSON.stringify(messagesResponse.data.messages, null, 2));
    
    // 5. Récupérer la liste des conversations
    console.log('📋 Récupération de la liste des conversations...');
    const conversationsResponse = await axios.get(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Liste des conversations:', JSON.stringify(conversationsResponse.data.conversations, null, 2));
    
    // 6. Tester l'envoi d'un message
    console.log('📝 Test envoi message...');
    const messageResponse = await axios.post(`${API_BASE}/conversations/${conversationId}/messages`, {
      contenu: 'Test message depuis le script de debug'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Message envoyé:', JSON.stringify(messageResponse.data.nouveau_message, null, 2));
    
    console.log('\n🎉 === DEBUG TERMINÉ ===');
    console.log(`🌐 URL à tester: http://localhost:3001/messages/${conversationId}`);
    
  } catch (error) {
    console.error('\n💥 === ERREUR DE DEBUG ===');
    console.error('Erreur:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⏰ Rate limiting actif. Attendez quelques minutes et réessayez.');
    }
  }
}

debugChat();
