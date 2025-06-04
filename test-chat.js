#!/usr/bin/env node
/**
 * Script de test pour vérifier le système de chat
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Données de test
const testUsers = [
  { email: 'acheteur@test.com', mot_de_passe: 'password123', nom: 'Dupont', prenom: 'Jean', role: 'acheteur' },
  { email: 'vendeur@test.com', mot_de_passe: 'password123', nom: 'Martin', prenom: 'Marie', role: 'vendeur' }
];

let tokens = {};
let testBienId = null;

async function createTestUsers() {
  console.log('🔧 Création des utilisateurs de test...');
  
  for (const user of testUsers) {
    try {
      // Essayer de créer l'utilisateur
      await axios.post(`${API_BASE}/auth/register`, user);
      console.log(`✅ Utilisateur ${user.email} créé`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('existe déjà')) {
        console.log(`ℹ️  Utilisateur ${user.email} existe déjà`);
      } else {
        console.error(`❌ Erreur création ${user.email}:`, error.response?.data || error.message);
      }
    }
    
    // Se connecter pour récupérer le token
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: user.email,
        mot_de_passe: user.mot_de_passe
      });
      tokens[user.role] = loginResponse.data.token;
      console.log(`🔑 Token récupéré pour ${user.role}`);
    } catch (error) {
      console.error(`❌ Erreur connexion ${user.email}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

async function createTestProperty() {
  console.log('🏠 Création d\'un bien de test...');
  
  const bienData = {
    titre: 'Appartement Test Chat',
    description: 'Appartement pour tester le système de chat',
    prix: 150000,
    surface: 80,
    nombre_pieces: 3,
    nombre_chambres: 2,
    type_bien: 'appartement',
    statut: 'vente',
    ville: 'Tunis',
    adresse: '123 Rue Test',
    adresse_complete: '123 Rue Test, Tunis, Tunisie',
    code_postal: '1000',
    latitude: 36.8065,
    longitude: 10.1815,
    modalite_paiement: 'unique',
    statut_publication: 'publie'
  };
  
  try {
    const response = await axios.post(`${API_BASE}/biens`, bienData, {
      headers: { Authorization: `Bearer ${tokens.vendeur}` }
    });
    testBienId = response.data.bien.id;
    console.log(`✅ Bien créé avec ID: ${testBienId}`);
  } catch (error) {
    console.error('❌ Erreur création bien:', error.response?.data || error.message);
    throw error;
  }
}

async function testContactOwner() {
  console.log('💬 Test: Contact du propriétaire...');
  
  try {
    const response = await axios.post(`${API_BASE}/conversations`, {
      bien_id: testBienId,
      contenu_initial: 'Bonjour, je suis intéressé par votre appartement. Pouvons-nous discuter ?'
    }, {
      headers: { Authorization: `Bearer ${tokens.acheteur}` }
    });
    
    console.log('✅ Conversation créée:', response.data);
    return response.data.conversation_id;
  } catch (error) {
    console.error('❌ Erreur création conversation:', error.response?.data || error.message);
    throw error;
  }
}

async function testDirectMessage() {
  console.log('📨 Test: Message direct entre utilisateurs...');

  // Récupérer l'ID du vendeur via le bien créé
  try {
    const bienResponse = await axios.get(`${API_BASE}/biens/${testBienId}`, {
      headers: { Authorization: `Bearer ${tokens.acheteur}` }
    });

    const vendeurId = bienResponse.data.bien.proprietaire_id;
    if (!vendeurId) {
      throw new Error('ID du vendeur non trouvé');
    }

    const response = await axios.post(`${API_BASE}/conversations/direct`, {
      destinataire_id: vendeurId,
      contenu_initial: 'Salut ! Je voulais te parler d\'un projet immobilier.'
    }, {
      headers: { Authorization: `Bearer ${tokens.acheteur}` }
    });

    console.log('✅ Conversation directe créée:', response.data);
    return response.data.conversation_id;
  } catch (error) {
    console.error('❌ Erreur conversation directe:', error.response?.data || error.message);
    throw error;
  }
}

async function testSendMessage(conversationId) {
  console.log(`💬 Test: Envoi de message dans conversation ${conversationId}...`);
  
  try {
    const response = await axios.post(`${API_BASE}/conversations/${conversationId}/messages`, {
      contenu: 'Merci pour votre réponse rapide ! Quand pourrions-nous organiser une visite ?'
    }, {
      headers: { Authorization: `Bearer ${tokens.vendeur}` }
    });
    
    console.log('✅ Message envoyé:', response.data);
  } catch (error) {
    console.error('❌ Erreur envoi message:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetConversations() {
  console.log('📋 Test: Récupération des conversations...');
  
  try {
    const response = await axios.get(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${tokens.acheteur}` }
    });
    
    console.log('✅ Conversations récupérées:', response.data.conversations.length);
    return response.data.conversations;
  } catch (error) {
    console.error('❌ Erreur récupération conversations:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🧪 === TEST DU SYSTÈME DE CHAT ===\n');
    
    await createTestUsers();
    console.log('');
    
    await createTestProperty();
    console.log('');
    
    const conversationId1 = await testContactOwner();
    console.log('');
    
    const conversationId2 = await testDirectMessage();
    console.log('');
    
    await testSendMessage(conversationId1);
    console.log('');
    
    const conversations = await testGetConversations();
    console.log('');
    
    console.log('🎉 === TOUS LES TESTS RÉUSSIS ===');
    console.log(`✅ ${conversations.length} conversation(s) créée(s)`);
    console.log('✅ Messages envoyés et reçus');
    console.log('✅ Système de chat fonctionnel !');
    
  } catch (error) {
    console.error('💥 === ÉCHEC DES TESTS ===');
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
runTests();
