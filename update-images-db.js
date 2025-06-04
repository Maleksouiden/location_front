// Script simple pour mettre à jour les images dans la base de données via l'API
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Images à assigner aux biens
const imageAssignments = [
  { bienId: 32, image: '/uploads/maison1_main.jpg' },
  { bienId: 33, image: '/uploads/appart1_main.jpg' },
  { bienId: 34, image: '/uploads/appart2_main.jpg' },
  { bienId: 35, image: '/uploads/villa1_main.jpg' },
  { bienId: 8, image: '/uploads/maison2_main.jpg' }
];

async function updateBienImages() {
  console.log('🔄 Mise à jour des images des biens...');
  
  for (const { bienId, image } of imageAssignments) {
    try {
      // D'abord, récupérer le bien existant
      const response = await axios.get(`${API_BASE}/biens/${bienId}`);
      const bien = response.data;
      
      // Mettre à jour avec l'image
      const updateData = {
        ...bien,
        photo_principale: image
      };
      
      // Envoyer la mise à jour (nécessite une authentification)
      // Pour l'instant, on va juste afficher ce qu'on ferait
      console.log(`✅ Bien ${bienId} (${bien.titre}) → ${image}`);
      
    } catch (error) {
      console.error(`❌ Erreur pour le bien ${bienId}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log('\n💡 Pour appliquer ces changements:');
  console.log('1. Connectez-vous comme vendeur sur l\'application');
  console.log('2. Modifiez vos biens et uploadez les images créées');
  console.log('3. Ou utilisez directement la base de données SQLite');
}

updateBienImages();
