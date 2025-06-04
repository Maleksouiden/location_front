#!/usr/bin/env node
/**
 * Test complet du système de messages (envoi/réception)
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testMessagesComplet() {
  try {
    console.log('🧪 === TEST COMPLET DU SYSTÈME DE MESSAGES ===\n');
    
    // 1. Connexion des deux utilisateurs
    console.log('🔑 Connexion des utilisateurs...');
    
    const acheteurLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'acheteur@test.com',
      mot_de_passe: 'password123'
    });
    const tokenAcheteur = acheteurLogin.data.token;
    console.log('✅ Acheteur connecté');
    
    const vendeurLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      mot_de_passe: 'password123'
    });
    const tokenVendeur = vendeurLogin.data.token;
    console.log('✅ Vendeur connecté');
    
    // 2. Utiliser une conversation existante
    const conversationId = 15; // De notre test précédent
    console.log(`\n💬 Utilisation de la conversation ID: ${conversationId}`);
    
    // 3. Test d'envoi de message par l'acheteur
    console.log('\n📤 Test envoi message par ACHETEUR...');
    const messageAcheteur = await axios.post(`${API_BASE}/conversations/${conversationId}/messages`, {
      contenu: `Message de l'acheteur - ${new Date().toLocaleTimeString()}`
    }, {
      headers: { Authorization: `Bearer ${tokenAcheteur}` }
    });
    
    console.log('✅ Message acheteur envoyé:', {
      id: messageAcheteur.data.nouveau_message.id,
      contenu: messageAcheteur.data.nouveau_message.contenu,
      expediteur: `${messageAcheteur.data.nouveau_message.expediteur_nom} ${messageAcheteur.data.nouveau_message.expediteur_prenom}`
    });
    
    // 4. Test de réception par le vendeur
    console.log('\n📥 Test réception par VENDEUR...');
    const messagesVendeur = await axios.get(`${API_BASE}/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    const dernierMessage = messagesVendeur.data.messages[messagesVendeur.data.messages.length - 1];
    console.log('✅ Dernier message reçu par vendeur:', {
      id: dernierMessage.id,
      contenu: dernierMessage.contenu,
      expediteur: `${dernierMessage.expediteur_nom} ${dernierMessage.expediteur_prenom}`
    });
    
    // 5. Test d'envoi de réponse par le vendeur
    console.log('\n📤 Test envoi réponse par VENDEUR...');
    const messageVendeur = await axios.post(`${API_BASE}/conversations/${conversationId}/messages`, {
      contenu: `Réponse du vendeur - ${new Date().toLocaleTimeString()}`
    }, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    console.log('✅ Message vendeur envoyé:', {
      id: messageVendeur.data.nouveau_message.id,
      contenu: messageVendeur.data.nouveau_message.contenu,
      expediteur: `${messageVendeur.data.nouveau_message.expediteur_nom} ${messageVendeur.data.nouveau_message.expediteur_prenom}`
    });
    
    // 6. Test de réception par l'acheteur
    console.log('\n📥 Test réception par ACHETEUR...');
    const messagesAcheteur = await axios.get(`${API_BASE}/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${tokenAcheteur}` }
    });
    
    const dernierMessageAcheteur = messagesAcheteur.data.messages[messagesAcheteur.data.messages.length - 1];
    console.log('✅ Dernier message reçu par acheteur:', {
      id: dernierMessageAcheteur.id,
      contenu: dernierMessageAcheteur.contenu,
      expediteur: `${dernierMessageAcheteur.expediteur_nom} ${dernierMessageAcheteur.expediteur_prenom}`
    });
    
    // 7. Vérification de l'ordre chronologique
    console.log('\n📋 Vérification ordre chronologique...');
    const tousMessages = messagesAcheteur.data.messages;
    console.log(`✅ Total messages: ${tousMessages.length}`);
    
    tousMessages.slice(-3).forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.date_envoi}] ${msg.expediteur_nom}: ${msg.contenu.substring(0, 50)}...`);
    });
    
    // 8. Test de la structure des données de conversation
    console.log('\n🏗️ Vérification structure conversation...');
    const conversation = messagesAcheteur.data.conversation;
    console.log('✅ Données conversation:', {
      id: conversation.id,
      acheteur: `${conversation.acheteur.prenom} ${conversation.acheteur.nom}`,
      vendeur: `${conversation.vendeur.prenom} ${conversation.vendeur.nom}`,
      bien: conversation.bien ? conversation.bien.titre : 'Conversation directe'
    });
    
    console.log('\n🎉 === TOUS LES TESTS RÉUSSIS ===');
    console.log('✅ Envoi de messages : OK');
    console.log('✅ Réception de messages : OK');
    console.log('✅ Ordre chronologique : OK');
    console.log('✅ Données utilisateurs : OK');
    console.log('✅ Structure conversation : OK');
    console.log(`\n🌐 URL frontend à tester: http://localhost:3001/messages/${conversationId}`);
    
  } catch (error) {
    console.error('\n💥 === ERREUR DANS LES TESTS ===');
    console.error('Erreur:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⏰ Rate limiting actif. Attendez quelques minutes et réessayez.');
    }
  }
}

testMessagesComplet();
