const { exec } = require('child_process');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'karya_tn.db');

const updates = [
  "UPDATE biens SET photo_principale = '/uploads/maison1_main.jpg' WHERE id = 32;",
  "UPDATE biens SET photo_principale = '/uploads/appart1_main.jpg' WHERE id = 33;",
  "UPDATE biens SET photo_principale = '/uploads/appart2_main.jpg' WHERE id = 34;",
  "UPDATE biens SET photo_principale = '/uploads/villa1_main.jpg' WHERE id = 35;",
  "UPDATE biens SET photo_principale = '/uploads/maison2_main.jpg' WHERE id = 8;",
  "UPDATE biens SET photo_principale = '/uploads/terrain1_main.jpg' WHERE id = 7;",
  "UPDATE biens SET photo_principale = '/uploads/bureau1_main.jpg' WHERE id = 6;",
  "UPDATE biens SET photo_principale = '/uploads/appart3_main.jpg' WHERE id = 5;"
];

console.log('🔄 Mise à jour des images dans la base de données...');

// Exécuter chaque mise à jour
updates.forEach((sql, index) => {
  exec(`sqlite3 "${dbPath}" "${sql}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Erreur mise à jour ${index + 1}:`, error.message);
    } else {
      console.log(`✅ Mise à jour ${index + 1} réussie`);
    }
    
    // Vérifier les résultats après la dernière mise à jour
    if (index === updates.length - 1) {
      setTimeout(() => {
        exec(`sqlite3 "${dbPath}" "SELECT id, titre, photo_principale FROM biens WHERE photo_principale IS NOT NULL;"`, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Erreur vérification:', error.message);
          } else {
            console.log('\n📸 Biens avec images:');
            console.log(stdout);
            console.log('🎉 Mise à jour terminée ! Testez l\'application maintenant.');
          }
        });
      }, 1000);
    }
  });
});
