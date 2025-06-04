// Script pour tester l'ajout de biens
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAddProperty() {
  console.log('🧪 Test d\'ajout de bien\n');

  try {
    // 1. Connexion vendeur
    console.log('1. Connexion vendeur...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'mohamed.benali@email.com',
      mot_de_passe: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie');

    // 2. Test d'ajout de bien
    console.log('\n2. Test d\'ajout de bien...');
    
    const newProperty = {
      titre: "Test - Appartement moderne centre-ville",
      description: "Bel appartement de 100m² entièrement rénové, proche de tous commerces et transports. Cuisine équipée, 2 chambres, salon lumineux.",
      type_bien: "appartement",
      statut: "vente",
      prix: 320000,
      modalite_paiement: "unique",
      surface: 100,
      nombre_pieces: 3,
      adresse_complete: "25 Rue de la République",
      ville: "Tunis",
      code_postal: "1000",
      latitude: 36.8065,
      longitude: 10.1815
    };

    console.log('Données à envoyer:', JSON.stringify(newProperty, null, 2));

    const response = await axios.post(`${API_BASE_URL}/biens`, newProperty, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Bien ajouté avec succès');
    console.log('Réponse:', JSON.stringify(response.data, null, 2));

    // 3. Vérification
    console.log('\n3. Vérification...');
    const biensResponse = await axios.get(`${API_BASE_URL}/biens/mes-biens`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Total des biens du vendeur: ${biensResponse.data.biens.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Détails de validation:', error.response.data.details);
    }
  }
}

// Exécuter le test
testAddProperty();
