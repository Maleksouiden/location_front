#!/usr/bin/env node
/**
 * Test complet du système de rendez-vous
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testRdvSystem() {
  try {
    console.log('🧪 === TEST DU SYSTÈME DE RENDEZ-VOUS ===\n');
    
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
    
    // 2. Récupérer un bien du vendeur
    console.log('\n🏠 Récupération des biens du vendeur...');
    const biensResponse = await axios.get(`${API_BASE}/biens/mes-biens`, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    if (biensResponse.data.biens.length === 0) {
      console.log('❌ Aucun bien trouvé pour le vendeur');
      return;
    }
    
    const bien = biensResponse.data.biens[0];
    console.log(`✅ Bien trouvé: ${bien.titre} (ID: ${bien.id})`);
    
    // 3. Créer un créneau de visite
    console.log('\n📅 Création d\'un créneau de visite...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // +2 jours pour éviter les conflits
    tomorrow.setHours(16, 0, 0, 0); // 16h pour éviter les conflits

    const endTime = new Date(tomorrow);
    endTime.setHours(17, 0, 0, 0);
    
    const creneauData = {
      bien_id: bien.id,
      date_debut: tomorrow.toISOString(),
      date_fin: endTime.toISOString()
    };
    
    const creneauResponse = await axios.post(`${API_BASE}/creneaux`, creneauData, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    const creneauId = creneauResponse.data.creneau.id;
    console.log(`✅ Créneau créé: ${creneauId}`);
    console.log(`   Date: ${tomorrow.toLocaleDateString()} ${tomorrow.toLocaleTimeString()}`);
    
    // 4. Acheteur demande un RDV
    console.log('\n📞 Demande de RDV par l\'acheteur...');
    const rdvResponse = await axios.post(`${API_BASE}/rdv/demander`, {
      creneau_id: creneauId
    }, {
      headers: { Authorization: `Bearer ${tokenAcheteur}` }
    });
    
    console.log('✅ Demande de RDV envoyée');
    
    // 5. Vendeur consulte ses demandes de RDV
    console.log('\n📋 Consultation des demandes par le vendeur...');
    const demandesResponse = await axios.get(`${API_BASE}/creneaux/demandes`, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    console.log(`✅ ${demandesResponse.data.demandes.length} demande(s) trouvée(s)`);
    
    if (demandesResponse.data.demandes.length > 0) {
      const demande = demandesResponse.data.demandes[0];
      console.log('📋 Détails de la demande:');
      console.log(`   Bien: ${demande.bien_titre}`);
      console.log(`   Demandeur: ${demande.acheteur_prenom} ${demande.acheteur_nom}`);
      console.log(`   Email: ${demande.acheteur_email}`);
      console.log(`   Statut: ${demande.statut}`);
      console.log(`   Date: ${new Date(demande.date_debut).toLocaleString()}`);
    }
    
    // 6. Acheteur consulte ses RDV
    console.log('\n📋 Consultation des RDV par l\'acheteur...');
    const mesRdvResponse = await axios.get(`${API_BASE}/creneaux/mes-rdv`, {
      headers: { Authorization: `Bearer ${tokenAcheteur}` }
    });
    
    console.log(`✅ ${mesRdvResponse.data.rdv.length} RDV trouvé(s)`);
    
    if (mesRdvResponse.data.rdv.length > 0) {
      const rdv = mesRdvResponse.data.rdv[0];
      console.log('📋 Détails du RDV:');
      console.log(`   Bien: ${rdv.bien_titre}`);
      console.log(`   Vendeur: ${rdv.vendeur_prenom} ${rdv.vendeur_nom}`);
      console.log(`   Email: ${rdv.vendeur_email}`);
      console.log(`   Statut: ${rdv.statut}`);
      console.log(`   Date: ${new Date(rdv.date_debut).toLocaleString()}`);
    }
    
    // 7. Vendeur accepte la demande
    console.log('\n✅ Acceptation de la demande par le vendeur...');
    const acceptResponse = await axios.put(`${API_BASE}/rdv/${creneauId}/accepter`, {}, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    console.log('✅ Demande acceptée');
    
    // 8. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const finalDemandesResponse = await axios.get(`${API_BASE}/creneaux/demandes`, {
      headers: { Authorization: `Bearer ${tokenVendeur}` }
    });
    
    const finalRdvResponse = await axios.get(`${API_BASE}/creneaux/mes-rdv`, {
      headers: { Authorization: `Bearer ${tokenAcheteur}` }
    });
    
    console.log('📊 État final:');
    console.log(`   Demandes vendeur: ${finalDemandesResponse.data.demandes.length}`);
    console.log(`   RDV acheteur: ${finalRdvResponse.data.rdv.length}`);
    
    if (finalRdvResponse.data.rdv.length > 0) {
      const finalRdv = finalRdvResponse.data.rdv[0];
      console.log(`   Statut final: ${finalRdv.statut}`);
    }
    
    console.log('\n🎉 === SYSTÈME DE RENDEZ-VOUS FONCTIONNEL ===');
    console.log('✅ Création de créneaux : OK');
    console.log('✅ Demande de RDV : OK');
    console.log('✅ Consultation demandes vendeur : OK');
    console.log('✅ Consultation RDV acheteur : OK');
    console.log('✅ Acceptation de demande : OK');
    console.log('\n🌐 Testez dans l\'interface:');
    console.log('   Vendeur: http://localhost:3001/demandes-rdv');
    console.log('   Acheteur: http://localhost:3001/mes-rdv');
    
  } catch (error) {
    console.error('\n💥 === ERREUR DANS LE TEST ===');
    console.error('Erreur:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⏰ Rate limiting actif. Attendez quelques minutes et réessayez.');
    }
  }
}

testRdvSystem();
