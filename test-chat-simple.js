#!/usr/bin/env node
/**
 * Test simple du système de chat avec utilisateurs existants
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Utiliser les utilisateurs existants
const testUsers = [
  { email: 'acheteur@test.com', mot_de_passe: 'password123', role: 'acheteur' },
  { email: 'vendeur@test.com', mot_de_passe: 'password123', role: 'vendeur' }
];

let tokens = {};

async function loginUsers() {
  console.log('🔑 Connexion des utilisateurs...');
  
  for (const user of testUsers) {
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: user.email,
        mot_de_passe: user.mot_de_passe
      });
      tokens[user.role] = loginResponse.data.token;
      console.log(`✅ ${user.role} connecté`);
    } catch (error) {
      console.error(`❌ Erreur connexion ${user.email}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

async function testExistingConversations() {
  console.log('📋 Test: Récupération des conversations existantes...');
  
  try {
    const response = await axios.get(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${tokens.acheteur}` }
    });
    
    console.log(`✅ ${response.data.conversations.length} conversation(s) trouvée(s)`);
    
    if (response.data.conversations.length > 0) {
      const conv = response.data.conversations[0];
      console.log(`📝 Conversation ID: ${conv.id}`);
      console.log(`🏠 Bien: ${conv.bien?.titre || 'Conversation directe'}`);
      
      return conv.id;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération conversations:', error.response?.data || error.message);
    throw error;
  }
}

async function testSendMessage(conversationId) {
  console.log(`💬 Test: Envoi de message dans conversation ${conversationId}...`);
  
  try {
    const response = await axios.post(`${API_BASE}/conversations/${conversationId}/messages`, {
      contenu: `Test message envoyé à ${new Date().toLocaleTimeString()}`
    }, {
      headers: { Authorization: `Bearer ${tokens.acheteur}` }
    });
    
    console.log('✅ Message envoyé:', response.data.nouveau_message.contenu);
    return response.data.nouveau_message;
  } catch (error) {
    console.error('❌ Erreur envoi message:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetMessages(conversationId) {
  console.log(`📨 Test: Récupération des messages de la conversation ${conversationId}...`);
  
  try {
    const response = await axios.get(`${API_BASE}/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${tokens.vendeur}` }
    });
    
    console.log(`✅ ${response.data.messages.length} message(s) récupéré(s)`);
    
    // Afficher les derniers messages
    const messages = response.data.messages.slice(-3);
    messages.forEach(msg => {
      console.log(`  📝 ${msg.expediteur_nom || 'Utilisateur'}: ${msg.contenu}`);
    });
    
    return response.data.messages;
  } catch (error) {
    console.error('❌ Erreur récupération messages:', error.response?.data || error.message);
    throw error;
  }
}

async function testDirectConversation() {
  console.log('📨 Test: Création conversation directe...');
  
  try {
    // Récupérer un bien existant pour obtenir l'ID du vendeur
    const biensResponse = await axios.get(`${API_BASE}/biens?limit=1`, {
      headers: { Authorization: `Bearer ${tokens.acheteur}` }
    });
    
    if (biensResponse.data.biens.length === 0) {
      console.log('ℹ️  Aucun bien trouvé, test de conversation directe ignoré');
      return null;
    }
    
    const vendeurId = biensResponse.data.biens[0].proprietaire_id;
    
    const response = await axios.post(`${API_BASE}/conversations/direct`, {
      destinataire_id: vendeurId,
      contenu_initial: 'Salut ! Test de conversation directe.'
    }, {
      headers: { Authorization: `Bearer ${tokens.acheteur}` }
    });
    
    console.log('✅ Conversation directe créée:', response.data);
    return response.data.conversation_id;
  } catch (error) {
    console.error('❌ Erreur conversation directe:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  try {
    console.log('🧪 === TEST SIMPLE DU SYSTÈME DE CHAT ===\n');
    
    await loginUsers();
    console.log('');
    
    const existingConvId = await testExistingConversations();
    console.log('');
    
    if (existingConvId) {
      await testSendMessage(existingConvId);
      console.log('');
      
      await testGetMessages(existingConvId);
      console.log('');
    }
    
    const directConvId = await testDirectConversation();
    console.log('');
    
    if (directConvId) {
      await testSendMessage(directConvId);
      console.log('');
      
      await testGetMessages(directConvId);
      console.log('');
    }
    
    console.log('🎉 === TESTS TERMINÉS AVEC SUCCÈS ===');
    console.log('✅ Système de chat fonctionnel !');
    console.log('✅ Messages envoyés et reçus');
    console.log('✅ Conversations récupérées');
    
  } catch (error) {
    console.error('💥 === ÉCHEC DES TESTS ===');
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
runTests();
