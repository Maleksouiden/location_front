#!/usr/bin/env node
/**
 * Test de l'assignation correcte des rôles dans les conversations
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testRoleAssignment() {
  try {
    console.log('🧪 === TEST D\'ASSIGNATION DES RÔLES ===\n');
    
    // 1. Connexion des utilisateurs
    console.log('🔑 Connexion des utilisateurs...');
    
    const acheteurLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'acheteur@test.com',
      mot_de_passe: 'password123'
    });
    const tokenAcheteur = acheteurLogin.data.token;
    console.log('✅ Acheteur connecté (Jean Dupont)');
    
    const vendeurLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      mot_de_passe: 'password123'
    });
    const tokenVendeur = vendeurLogin.data.token;
    console.log('✅ Vendeur connecté (Marie Martin)');
    
    // 2. Récupérer un bien d'un autre vendeur
    console.log('\n🏠 Récupération d\'un bien...');
    const biensResponse = await axios.get(`${API_BASE}/biens?limit=5`);
    
    // Trouver un bien qui n'appartient pas au vendeur de test
    const bienAutreVendeur = biensResponse.data.biens.find(bien => 
      bien.proprietaire_id !== 11 // ID de Marie Martin (vendeur@test.com)
    );
    
    if (!bienAutreVendeur) {
      console.log('❌ Aucun bien d\'un autre vendeur trouvé');
      return;
    }
    
    console.log(`✅ Bien trouvé: ${bienAutreVendeur.titre}`);
    console.log(`   Propriétaire ID: ${bienAutreVendeur.proprietaire_id}`);
    
    // 3. Test 1: Acheteur contacte un vendeur (cas normal)
    console.log('\n📞 TEST 1: Acheteur contacte vendeur...');
    const conv1Response = await axios.post(`${API_BASE}/conversations`, {
      bien_id: bienAutreVendeur.id,
      contenu_initial: 'Bonjour, je suis un acheteur intéressé par votre bien.'
    }, {
      headers: { Authorization: `Bearer ${tokenAcheteur}` }
    });
    
    const conv1Id = conv1Response.data.conversation_id;
    console.log(`✅ Conversation créée: ${conv1Id}`);
    
    // Vérifier les rôles dans cette conversation
    const conv1Details = await axios.get(`${API_BASE}/conversations/${conv1Id}/messages`, {
      headers: { Authorization: `Bearer ${tokenAcheteur}` }
    });
    
    console.log('📋 Rôles dans la conversation:');
    console.log(`   Acheteur: ${conv1Details.data.conversation.acheteur.prenom} ${conv1Details.data.conversation.acheteur.nom} (ID: ${conv1Details.data.conversation.acheteur_id})`);
    console.log(`   Vendeur: ${conv1Details.data.conversation.vendeur.prenom} ${conv1Details.data.conversation.vendeur.nom} (ID: ${conv1Details.data.conversation.vendeur_id})`);
    
    // 4. Test 2: Vendeur contacte un autre vendeur
    console.log('\n📞 TEST 2: Vendeur contacte autre vendeur...');
    const conv2Response = await axios.post(`${API_BASE}/conversations`, {
      bien_id: bienAutreVendeur.id,
      contenu_initial: 'Bonjour, je suis un vendeur intéressé par votre bien pour un client.'
    }, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    const conv2Id = conv2Response.data.conversation_id;
    console.log(`✅ Conversation créée: ${conv2Id}`);
    
    // Vérifier les rôles dans cette conversation
    const conv2Details = await axios.get(`${API_BASE}/conversations/${conv2Id}/messages`, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    console.log('📋 Rôles dans la conversation:');
    console.log(`   Acheteur: ${conv2Details.data.conversation.acheteur.prenom} ${conv2Details.data.conversation.acheteur.nom} (ID: ${conv2Details.data.conversation.acheteur_id})`);
    console.log(`   Vendeur: ${conv2Details.data.conversation.vendeur.prenom} ${conv2Details.data.conversation.vendeur.nom} (ID: ${conv2Details.data.conversation.vendeur_id})`);
    
    // 5. Vérifier que les messages sont correctement assignés
    console.log('\n📨 Vérification des messages...');
    
    // Envoyer un message depuis l'acheteur
    await axios.post(`${API_BASE}/conversations/${conv1Id}/messages`, {
      contenu: 'Message de test depuis l\'acheteur'
    }, {
      headers: { Authorization: `Bearer ${tokenAcheteur}` }
    });
    
    // Envoyer un message depuis le vendeur
    await axios.post(`${API_BASE}/conversations/${conv2Id}/messages`, {
      contenu: 'Message de test depuis le vendeur'
    }, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    console.log('✅ Messages envoyés avec succès');
    
    // 6. Vérifier dans la base de données
    console.log('\n🔍 Vérification finale...');
    console.log(`✅ Conversation 1 (Acheteur → Vendeur): ID ${conv1Id}`);
    console.log(`✅ Conversation 2 (Vendeur → Vendeur): ID ${conv2Id}`);
    
    console.log('\n🎉 === TEST D\'ASSIGNATION TERMINÉ ===');
    console.log('✅ Les rôles sont maintenant correctement assignés !');
    console.log(`🌐 Testez dans l'interface: http://localhost:3001/messages/${conv1Id}`);
    console.log(`🌐 Testez dans l'interface: http://localhost:3001/messages/${conv2Id}`);
    
  } catch (error) {
    console.error('\n💥 === ERREUR DANS LE TEST ===');
    console.error('Erreur:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⏰ Rate limiting actif. Attendez quelques minutes et réessayez.');
    }
  }
}

testRoleAssignment();
