// Script pour vérifier le contenu de la base de données
const { query } = require('./config/database-sqlite');

async function checkDatabase() {
  console.log('🔍 Vérification de la base de données\n');

  try {
    // Vérifier les utilisateurs
    console.log('1. Utilisateurs:');
    const users = await query('SELECT id, nom, prenom, email, role FROM utilisateurs');
    console.log(`   Total: ${users.length} utilisateurs`);
    users.forEach(user => {
      console.log(`   - ${user.prenom} ${user.nom} (${user.email}) - ${user.role}`);
    });

    // Vérifier les biens
    console.log('\n2. Biens immobiliers:');
    const biens = await query('SELECT id, titre, ville, statut, statut_publication, proprietaire_id FROM biens');
    console.log(`   Total: ${biens.length} biens`);
    
    if (biens.length > 0) {
      biens.forEach(bien => {
        console.log(`   - ${bien.titre} (${bien.ville}) - ${bien.statut} - ${bien.statut_publication}`);
      });

      // Vérifier les biens par statut de publication
      const biensPublies = await query('SELECT COUNT(*) as count FROM biens WHERE statut_publication = ?', ['publie']);
      console.log(`   Biens publiés: ${biensPublies[0].count}`);
      
      const biensBrouillon = await query('SELECT COUNT(*) as count FROM biens WHERE statut_publication = ?', ['brouillon']);
      console.log(`   Biens en brouillon: ${biensBrouillon[0].count}`);
    }

    // Vérifier les conversations
    console.log('\n3. Conversations:');
    const conversations = await query('SELECT COUNT(*) as count FROM conversations');
    console.log(`   Total: ${conversations[0].count} conversations`);

    // Vérifier les créneaux
    console.log('\n4. Créneaux:');
    const creneaux = await query('SELECT COUNT(*) as count FROM creneaux');
    console.log(`   Total: ${creneaux[0].count} créneaux`);

    console.log('\n✅ Vérification terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter la vérification
checkDatabase();
