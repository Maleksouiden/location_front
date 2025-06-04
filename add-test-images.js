const fs = require('fs');
const path = require('path');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Créer des images SVG de test
const createTestImage = (filename, color, text) => {
  const svg = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
    ${text}
  </text>
</svg>`;
  
  fs.writeFileSync(path.join(uploadsDir, filename), svg);
  console.log(`✅ Image créée: ${filename}`);
};

// Créer plusieurs images de test
const testImages = [
  { filename: 'appart1_main.jpg', color: '#667eea', text: 'Appartement Tunis' },
  { filename: 'appart2_main.jpg', color: '#764ba2', text: 'Villa Sfax' },
  { filename: 'maison1_main.jpg', color: '#f093fb', text: 'Maison Sousse' },
  { filename: 'villa1_main.jpg', color: '#f5576c', text: 'Villa Bizerte' },
  { filename: 'terrain1_main.jpg', color: '#4facfe', text: 'Terrain Nabeul' },
  { filename: 'bureau1_main.jpg', color: '#43e97b', text: 'Bureau Ariana' },
  { filename: 'appart3_main.jpg', color: '#fa709a', text: 'Appartement Gabès' },
  { filename: 'maison2_main.jpg', color: '#fee140', text: 'Maison Kairouan' }
];

console.log('🖼️ Création des images de test...');
testImages.forEach(img => createTestImage(img.filename, img.color, img.text));

console.log('\n🎉 Images de test créées avec succès !');
console.log('📁 Images disponibles dans le dossier uploads/');
console.log('🌐 Les images seront accessibles via http://localhost:3000/uploads/');

// Afficher les images créées
console.log('\n📸 Images créées:');
testImages.forEach(img => {
  console.log(`  - ${img.filename} (${img.text})`);
});

console.log('\n💡 Pour tester les images:');
console.log('1. Connectez-vous comme vendeur');
console.log('2. Modifiez un bien existant');
console.log('3. Uploadez une des images créées');
console.log('4. Ou utilisez l\'API pour mettre à jour directement la base de données');
