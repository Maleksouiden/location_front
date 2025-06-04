// Script pour ajouter des biens de démonstration
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

const demoProperties = [
  {
    titre: "Magnifique villa avec piscine à Sidi Bou Said",
    description: "Superbe villa de 300m² avec piscine privée, jardin paysager et vue mer panoramique. 5 chambres, 3 salles de bains, salon spacieux avec cheminée, cuisine équipée moderne. Garage pour 2 voitures. Quartier résidentiel calme et sécurisé.",
    type_bien: "villa",
    statut: "vente",
    prix: 850000,
    modalite_paiement: "unique",
    surface: 300,
    nombre_pieces: 8,
    adresse_complete: "15 Avenue Habib Thameur, Sidi Bou Said",
    ville: "Sidi Bou Said",
    code_postal: "2026",
    latitude: 36.8704,
    longitude: 10.3472
  },
  {
    titre: "Appartement moderne 3 pièces centre-ville Tunis",
    description: "Bel appartement de 120m² au 4ème étage avec ascenseur. 3 chambres, 2 salles de bains, salon lumineux, cuisine équipée, balcon avec vue sur la ville. Proche métro et commerces. Idéal pour famille ou investissement locatif.",
    type_bien: "appartement",
    statut: "vente",
    prix: 280000,
    modalite_paiement: "unique",
    surface: 120,
    nombre_pieces: 4,
    adresse_complete: "45 Avenue Bourguiba, Centre-ville",
    ville: "Tunis",
    code_postal: "1000",
    latitude: 36.8065,
    longitude: 10.1815
  },
  {
    titre: "Maison traditionnelle rénovée à Sousse",
    description: "Charmante maison traditionnelle entièrement rénovée de 180m². 4 chambres, 2 salles de bains, salon avec voûtes authentiques, cuisine moderne, terrasse sur toit avec vue mer. Proche médina et plages.",
    type_bien: "maison",
    statut: "vente",
    prix: 420000,
    modalite_paiement: "unique",
    surface: 180,
    nombre_pieces: 6,
    adresse_complete: "12 Rue de la Médina",
    ville: "Sousse",
    code_postal: "4000",
    latitude: 35.8256,
    longitude: 10.6369
  },
  {
    titre: "Studio meublé à louer - Lac 2",
    description: "Studio moderne de 45m² entièrement meublé et équipé. Kitchenette, salle de bains, balcon, parking. Résidence sécurisée avec piscine et salle de sport. Proche centres commerciaux et transports.",
    type_bien: "appartement",
    statut: "location",
    prix: 800,
    modalite_paiement: "mensuel",
    surface: 45,
    nombre_pieces: 1,
    adresse_complete: "Résidence Les Jardins du Lac, Lac 2",
    ville: "Tunis",
    code_postal: "1053",
    latitude: 36.8422,
    longitude: 10.2441
  },
  {
    titre: "Terrain constructible 500m² à Hammamet",
    description: "Excellent terrain de 500m² dans zone résidentielle calme à Hammamet. Proche plages et centre-ville. Toutes commodités à proximité. Idéal pour construction villa ou investissement. Titre foncier en règle.",
    type_bien: "terrain",
    statut: "vente",
    prix: 180000,
    modalite_paiement: "unique",
    surface: 500,
    nombre_pieces: 0,
    adresse_complete: "Zone Touristique Hammamet Nord",
    ville: "Hammamet",
    code_postal: "8050",
    latitude: 36.4167,
    longitude: 10.6167
  },
  {
    titre: "Appartement 4 pièces à louer - Menzah 6",
    description: "Spacieux appartement de 140m² au 2ème étage. 3 chambres, 2 salles de bains, grand salon, cuisine équipée, 2 balcons. Parking privé. Quartier résidentiel calme, proche écoles et commerces.",
    type_bien: "appartement",
    statut: "location",
    prix: 1200,
    modalite_paiement: "mensuel",
    surface: 140,
    nombre_pieces: 5,
    adresse_complete: "Rue des Roses, Menzah 6",
    ville: "Tunis",
    code_postal: "1004",
    latitude: 36.8581,
    longitude: 10.1869
  }
];

async function addDemoProperties() {
  console.log('🏠 Ajout de biens de démonstration\n');

  try {
    // Connexion avec le vendeur Mohamed Ben Ali
    console.log('1. Connexion vendeur Mohamed Ben Ali...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'mohamed.benali@email.com',
      mot_de_passe: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie');

    // Ajouter les biens un par un
    console.log('\n2. Ajout des biens...');
    
    for (let i = 0; i < demoProperties.length; i++) {
      const property = demoProperties[i];
      
      try {
        const response = await axios.post(`${API_BASE_URL}/biens`, property, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✅ Bien ${i + 1}/${demoProperties.length} ajouté: ${property.titre}`);
      } catch (error) {
        console.log(`❌ Erreur bien ${i + 1}: ${error.response?.data?.message || error.message}`);
      }
    }

    // Vérification finale
    console.log('\n3. Vérification des biens ajoutés...');
    const biensResponse = await axios.get(`${API_BASE_URL}/biens`);
    console.log(`✅ Total des biens dans la base: ${biensResponse.data.total}`);

    console.log('\n🎉 Biens de démonstration ajoutés avec succès !');
    console.log('\n📋 Vous pouvez maintenant:');
    console.log('   - Tester la recherche sur le frontend');
    console.log('   - Voir les biens dans "Mes biens" (vendeur)');
    console.log('   - Contacter le vendeur (acheteur)');
    console.log('   - Naviguer entre les pages de détail');

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

// Exécuter le script
addDemoProperties();
