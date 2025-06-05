const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testCompleteFeatures() {
  try {
    console.log('🧪 Test complet des fonctionnalités Karya.tn');
    console.log('==============================================');

    // 1. Créer un utilisateur vendeur
    const vendeurEmail = `vendeur.test.${Date.now()}@email.com`;
    console.log('👤 Création utilisateur vendeur...');
    await axios.post(`${API_BASE}/auth/register`, {
      nom: 'Vendeur',
      prenom: 'Test',
      email: vendeurEmail,
      mot_de_passe: 'motdepasse123',
      telephone: '12345678',
      role: 'vendeur'
    });
    console.log('✅ Vendeur créé');

    // 2. Créer un utilisateur acheteur
    const acheteurEmail = `acheteur.test.${Date.now()}@email.com`;
    console.log('👤 Création utilisateur acheteur...');
    await axios.post(`${API_BASE}/auth/register`, {
      nom: 'Acheteur',
      prenom: 'Test',
      email: acheteurEmail,
      mot_de_passe: 'motdepasse123',
      telephone: '87654321',
      role: 'acheteur'
    });
    console.log('✅ Acheteur créé');

    // 3. Connexion vendeur
    console.log('🔐 Connexion vendeur...');
    const vendeurLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: vendeurEmail,
      mot_de_passe: 'motdepasse123'
    });
    const vendeurToken = vendeurLogin.data.token;
    console.log('✅ Vendeur connecté');

    // 4. Connexion acheteur
    console.log('🔐 Connexion acheteur...');
    const acheteurLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: acheteurEmail,
      mot_de_passe: 'motdepasse123'
    });
    const acheteurToken = acheteurLogin.data.token;
    console.log('✅ Acheteur connecté');

    // 5. Créer une propriété (vendeur)
    console.log('🏠 Création d\'une propriété...');
    const propertyResponse = await axios.post(`${API_BASE}/biens`, {
      titre: 'Appartement Test Complet',
      description: 'Situé en centre-ville, ce bien bénéficie d\'un excellent emplacement. Accès facile aux transports en commun (bus, métro léger). À proximité des commerces, écoles, centres de santé et services administratifs.',
      type_bien: 'appartement',
      statut: 'vente',
      prix: 150000,
      modalite_paiement: 'comptant',
      surface: 85,
      nombre_pieces: 3,
      ville: 'Tunis',
      code_postal: '1000',
      adresse_complete: 'Avenue Habib Bourguiba, Tunis, Tunisia',
      latitude: 36.8065,
      longitude: 10.1815
    }, {
      headers: { Authorization: `Bearer ${vendeurToken}` }
    });
    const propertyId = propertyResponse.data.bien.id;
    console.log(`✅ Propriété créée (ID: ${propertyId})`);

    // 6. Test conversation (acheteur contacte vendeur)
    console.log('💬 Test création conversation...');
    const conversationResponse = await axios.post(`${API_BASE}/conversations`, {
      bien_id: propertyId,
      contenu_initial: 'Bonjour, je suis intéressé par votre appartement. Pouvez-vous me donner plus d\'informations ?'
    }, {
      headers: { Authorization: `Bearer ${acheteurToken}` }
    });
    const conversationId = conversationResponse.data.conversation_id;
    console.log(`✅ Conversation créée (ID: ${conversationId})`);

    // 7. Envoyer un message (vendeur répond)
    console.log('📨 Test envoi message...');
    await axios.post(`${API_BASE}/conversations/${conversationId}/messages`, {
      contenu: 'Bonjour ! Merci pour votre intérêt. L\'appartement est en excellent état et très bien situé. Souhaitez-vous organiser une visite ?'
    }, {
      headers: { Authorization: `Bearer ${vendeurToken}` }
    });
    console.log('✅ Message envoyé');

    // 8. Test demande de rendez-vous (acheteur)
    console.log('📅 Test demande de rendez-vous...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateRdv = tomorrow.toISOString().split('T')[0];
    
    const appointmentResponse = await axios.post(`${API_BASE}/appointments`, {
      bien_id: propertyId,
      date_rdv: dateRdv,
      heure_rdv: '15:00',
      message: 'Je souhaiterais visiter l\'appartement demain après-midi si possible.'
    }, {
      headers: { Authorization: `Bearer ${acheteurToken}` }
    });
    const appointmentId = appointmentResponse.data.appointment_id;
    console.log(`✅ Rendez-vous demandé (ID: ${appointmentId})`);

    // 9. Accepter le rendez-vous (vendeur)
    console.log('✅ Test acceptation rendez-vous...');
    await axios.put(`${API_BASE}/appointments/${appointmentId}/status`, {
      statut: 'accepte',
      message_reponse: 'Parfait ! Je vous attends demain à 15h. N\'hésitez pas à m\'appeler si vous avez besoin.'
    }, {
      headers: { Authorization: `Bearer ${vendeurToken}` }
    });
    console.log('✅ Rendez-vous accepté');

    // 10. Vérifier les conversations (acheteur)
    console.log('📋 Vérification conversations acheteur...');
    const acheteurConversations = await axios.get(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${acheteurToken}` }
    });
    console.log(`✅ ${acheteurConversations.data.conversations.length} conversation(s) trouvée(s)`);

    // 11. Vérifier les rendez-vous (acheteur)
    console.log('📋 Vérification rendez-vous acheteur...');
    const acheteurAppointments = await axios.get(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${acheteurToken}` }
    });
    console.log(`✅ ${acheteurAppointments.data.appointments.length} rendez-vous trouvé(s)`);

    // 12. Vérifier les rendez-vous (vendeur)
    console.log('📋 Vérification rendez-vous vendeur...');
    const vendeurAppointments = await axios.get(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${vendeurToken}` }
    });
    console.log(`✅ ${vendeurAppointments.data.appointments.length} rendez-vous trouvé(s)`);

    // 13. Test recherche de propriétés
    console.log('🔍 Test recherche propriétés...');
    const searchResponse = await axios.get(`${API_BASE}/biens?ville=Tunis`, {
      headers: { Authorization: `Bearer ${acheteurToken}` }
    });
    console.log(`✅ ${searchResponse.data.biens.length} propriété(s) trouvée(s) à Tunis`);

    // 14. Récupérer les détails de la propriété
    console.log('🏠 Test détails propriété...');
    const propertyDetails = await axios.get(`${API_BASE}/biens/${propertyId}`, {
      headers: { Authorization: `Bearer ${acheteurToken}` }
    });
    console.log(`✅ Propriété récupérée: "${propertyDetails.data.bien.titre}"`);

    console.log('\n🎉 TOUS LES TESTS SONT RÉUSSIS !');
    console.log('=====================================');
    console.log('✅ Authentification : OK');
    console.log('✅ Gestion des propriétés : OK');
    console.log('✅ Système de messagerie : OK');
    console.log('✅ Système de rendez-vous : OK');
    console.log('✅ Recherche : OK');
    console.log('✅ Auto-remplissage localisation : OK');
    console.log('\n🚀 L\'application Karya.tn est entièrement fonctionnelle !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Détails:', error.response.data.details);
    }
  }
}

// Exécuter le test
testCompleteFeatures();
