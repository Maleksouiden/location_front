const { query } = require('./config/database-sqlite');
const bcrypt = require('bcryptjs');

// Nouvelles propriétés à ajouter
const newProperties = [
  {
    titre: "Villa Moderne avec Piscine - Sidi Bou Said",
    description: "Magnifique villa contemporaine de 300m² avec piscine privée, jardin paysager et vue mer panoramique. Située dans le prestigieux quartier de Sidi Bou Said, cette propriété offre 5 chambres, 4 salles de bains, un salon spacieux avec cheminée, une cuisine équipée haut de gamme et une terrasse de 50m². Idéale pour une famille recherchant le luxe et la tranquillité.",
    prix: 850000,
    surface: 300,
    nombre_pieces: 5,
    nombre_chambres: 5,
    nombre_salles_bain: 4,
    type_bien: "villa",
    statut: "vente",
    adresse_complete: "Route de la Corniche, Sidi Bou Said",
    ville: "Sidi Bou Said",
    code_postal: "2026",
    latitude: 36.8704,
    longitude: 10.3472,
    proprietaire_id: 2, // Mohamed Benali
    images: JSON.stringify(["/uploads/properties/villa-sidi-bou-said-1.jpg", "/uploads/properties/villa-sidi-bou-said-2.jpg"])
  },
  {
    titre: "Appartement Standing Centre-Ville Tunis",
    description: "Superbe appartement de 120m² au cœur de Tunis, entièrement rénové avec des finitions de qualité. Comprend 3 chambres, 2 salles de bains, un salon lumineux, une cuisine moderne équipée et un balcon avec vue sur la ville. Proche de tous les commerces, transports et services. Parfait pour un investissement locatif ou résidence principale.",
    prix: 280000,
    surface: 120,
    nombre_pieces: 4,
    nombre_chambres: 3,
    nombre_salles_bain: 2,
    type_bien: "appartement",
    statut: "vente",
    adresse_complete: "Avenue Habib Bourguiba, Centre-Ville",
    ville: "Tunis",
    code_postal: "1000",
    latitude: 36.8065,
    longitude: 10.1815,
    proprietaire_id: 2,
    images: JSON.stringify(["/uploads/properties/appartement-tunis-1.jpg", "/uploads/properties/appartement-tunis-2.jpg"])
  },
  {
    titre: "Duplex Luxueux avec Terrasse - La Marsa",
    description: "Magnifique duplex de 200m² avec terrasse privée de 80m² offrant une vue imprenable sur la mer. 4 chambres dont une suite parentale, 3 salles de bains, double salon, cuisine équipée, garage pour 2 voitures. Résidence sécurisée avec piscine commune et gardiennage 24h/24. Proche plages et centre commercial.",
    prix: 650000,
    surface: 200,
    nombre_pieces: 6,
    nombre_chambres: 4,
    nombre_salles_bain: 3,
    type_bien: "appartement", // Duplex n'est pas dans la liste, utilisons appartement
    statut: "vente",
    adresse_complete: "Résidence Les Palmiers, La Marsa",
    ville: "La Marsa",
    code_postal: "2078",
    latitude: 36.8783,
    longitude: 10.3247,
    proprietaire_id: 15, // Ahmed Trabelsi
    images: JSON.stringify(["/uploads/properties/duplex-marsa-1.jpg", "/uploads/properties/duplex-marsa-2.jpg", "/uploads/properties/duplex-marsa-3.jpg"])
  }
];

// Nouveaux utilisateurs
const newUsers = [
  {
    nom: "Admin",
    prenom: "Super",
    email: "superadmin@karya.tn",
    mot_de_passe: "admin123",
    role: "admin",
    telephone: "+216 20 000 000"
  }
];

async function addSampleData() {
  try {
    console.log('🚀 Ajout des données d\'exemple...');

    // 1. Créer le super admin s'il n'existe pas
    console.log('👨‍💼 Création du super admin...');
    
    for (const user of newUsers) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await query(
        'SELECT id FROM utilisateurs WHERE email = ?',
        [user.email]
      );

      if (existingUser.length === 0) {
        const hashedPassword = await bcrypt.hash(user.mot_de_passe, 10);
        
        const result = await query(
          `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [user.nom, user.prenom, user.email, hashedPassword, user.role, user.telephone]
        );
        
        console.log(`✅ Super admin créé: ${user.prenom} ${user.nom} (${user.email})`);
      } else {
        console.log(`ℹ️  Super admin existe déjà: ${user.email}`);
      }
    }

    // 2. Ajouter les nouvelles propriétés
    console.log('🏠 Ajout des nouvelles propriétés...');
    
    for (const property of newProperties) {
      // Vérifier si la propriété existe déjà (par titre)
      const existingProperty = await query(
        'SELECT id FROM biens WHERE titre = ?',
        [property.titre]
      );

      if (existingProperty.length === 0) {
        const result = await query(
          `INSERT INTO biens (
            titre, description, prix, surface, nombre_pieces,
            type_bien, statut, modalite_paiement, adresse_complete, ville, code_postal,
            latitude, longitude, proprietaire_id, statut_publication
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'publie')`,
          [
            property.titre,
            property.description,
            property.prix,
            property.surface,
            property.nombre_pieces,
            property.type_bien,
            property.statut,
            property.statut === 'vente' ? 'unique' : 'mensuel',
            property.adresse_complete,
            property.ville,
            property.code_postal,
            property.latitude,
            property.longitude,
            property.proprietaire_id
          ]
        );
        
        console.log(`✅ Propriété ajoutée: ${property.titre}`);
      } else {
        console.log(`ℹ️  Propriété existe déjà: ${property.titre}`);
      }
    }

    // 3. Vérifier les résultats
    console.log('\n📊 Résumé final:');
    
    const usersCount = await query('SELECT COUNT(*) as count FROM utilisateurs');
    console.log(`👥 Total utilisateurs: ${usersCount[0].count}`);
    
    const propertiesCount = await query('SELECT COUNT(*) as count FROM biens');
    console.log(`🏠 Total propriétés: ${propertiesCount[0].count}`);
    
    const adminsCount = await query("SELECT COUNT(*) as count FROM utilisateurs WHERE role = 'admin'");
    console.log(`👨‍💼 Admins: ${adminsCount[0].count}`);

    // 4. Afficher les comptes de test
    console.log('\n🔑 Comptes de test disponibles:');
    console.log('👨‍💼 Super Admin: superadmin@karya.tn / admin123');
    console.log('👨‍💼 Admin: admin@karya.tn / password123');
    console.log('🏪 Vendeur 1: mohamed.benali@email.com / password123');
    console.log('🏪 Vendeur 2: ahmed.trabelsi@email.com / password123');
    console.log('🏪 Vendeur 3: sonia.khelifi@email.com / password123');
    console.log('🛒 Acheteur: leila.bouazizi@email.com / password123');

    console.log('\n🎉 Données d\'exemple ajoutées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  addSampleData().then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
}

module.exports = { addSampleData };
