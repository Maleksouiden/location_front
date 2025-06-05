const { db } = require('./config/database-sqlite');
const bcrypt = require('bcryptjs');

// Données de test pour les propriétés
const sampleProperties = [
  {
    titre: "Villa Moderne avec Piscine - Sidi Bou Said",
    description: "Magnifique villa contemporaine de 300m² avec piscine privée, jardin paysager et vue mer panoramique. Située dans le prestigieux quartier de Sidi Bou Said, cette propriété offre 5 chambres, 4 salles de bains, un salon spacieux avec cheminée, une cuisine équipée haut de gamme et une terrasse de 50m². Idéale pour une famille recherchant le luxe et la tranquillité.",
    prix: 850000,
    surface: 300,
    nombre_pieces: 5,
    nombre_chambres: 5,
    nombre_salles_bain: 4,
    type_bien: "Villa",
    statut: "vente",
    adresse: "Route de la Corniche, Sidi Bou Said",
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
    type_bien: "Appartement",
    statut: "vente",
    adresse: "Avenue Habib Bourguiba, Centre-Ville",
    ville: "Tunis",
    code_postal: "1000",
    latitude: 36.8065,
    longitude: 10.1815,
    proprietaire_id: 2,
    images: JSON.stringify(["/uploads/properties/appartement-tunis-1.jpg", "/uploads/properties/appartement-tunis-2.jpg"])
  },
  {
    titre: "Maison Traditionnelle Rénovée - Sousse",
    description: "Charmante maison traditionnelle tunisienne de 180m² entièrement rénovée dans le respect de l'architecture locale. 4 chambres, 3 salles de bains, patio central avec fontaine, terrasse sur le toit avec vue mer. Située dans la médina de Sousse, à 5 minutes à pied de la plage. Idéale pour résidence secondaire ou maison d'hôtes.",
    prix: 320000,
    surface: 180,
    nombre_pieces: 5,
    nombre_chambres: 4,
    nombre_salles_bain: 3,
    type_bien: "Maison",
    statut: "vente",
    adresse: "Rue de la Médina, Sousse",
    ville: "Sousse",
    code_postal: "4000",
    latitude: 35.8256,
    longitude: 10.6369,
    proprietaire_id: 4, // Nouveau vendeur
    images: JSON.stringify(["/uploads/properties/maison-sousse-1.jpg", "/uploads/properties/maison-sousse-2.jpg"])
  },
  {
    titre: "Studio Meublé Proche Université - Tunis",
    description: "Studio moderne de 35m² entièrement meublé et équipé, idéal pour étudiant ou jeune professionnel. Cuisine américaine, salle de bain avec douche, espace de travail, connexion WiFi haut débit. Situé à 10 minutes de l'université et proche des transports en commun. Charges incluses.",
    prix: 450,
    surface: 35,
    nombre_pieces: 1,
    nombre_chambres: 1,
    nombre_salles_bain: 1,
    type_bien: "Studio",
    statut: "location",
    adresse: "Rue de l'Université, Manouba",
    ville: "Manouba",
    code_postal: "2010",
    latitude: 36.8083,
    longitude: 10.0956,
    proprietaire_id: 2,
    images: JSON.stringify(["/uploads/properties/studio-manouba-1.jpg"])
  },
  {
    titre: "Duplex Luxueux avec Terrasse - La Marsa",
    description: "Magnifique duplex de 200m² avec terrasse privée de 80m² offrant une vue imprenable sur la mer. 4 chambres dont une suite parentale, 3 salles de bains, double salon, cuisine équipée, garage pour 2 voitures. Résidence sécurisée avec piscine commune et gardiennage 24h/24. Proche plages et centre commercial.",
    prix: 650000,
    surface: 200,
    nombre_pieces: 6,
    nombre_chambres: 4,
    nombre_salles_bain: 3,
    type_bien: "Duplex",
    statut: "vente",
    adresse: "Résidence Les Palmiers, La Marsa",
    ville: "La Marsa",
    code_postal: "2078",
    latitude: 36.8783,
    longitude: 10.3247,
    proprietaire_id: 4,
    images: JSON.stringify(["/uploads/properties/duplex-marsa-1.jpg", "/uploads/properties/duplex-marsa-2.jpg", "/uploads/properties/duplex-marsa-3.jpg"])
  },
  {
    titre: "Appartement 2 Pièces Rénové - Sfax",
    description: "Appartement de 75m² récemment rénové au 3ème étage avec ascenseur. 2 chambres, salon, cuisine équipée, salle de bain moderne, balcon. Situé dans un quartier calme et résidentiel, proche des écoles et commerces. Idéal pour jeune couple ou investissement locatif.",
    prix: 145000,
    surface: 75,
    nombre_pieces: 3,
    nombre_chambres: 2,
    nombre_salles_bain: 1,
    type_bien: "Appartement",
    statut: "vente",
    adresse: "Rue de la République, Sfax",
    ville: "Sfax",
    code_postal: "3000",
    latitude: 34.7406,
    longitude: 10.7603,
    proprietaire_id: 5, // Nouveau vendeur
    images: JSON.stringify(["/uploads/properties/appartement-sfax-1.jpg"])
  },
  {
    titre: "Villa avec Jardin - Hammamet",
    description: "Belle villa de 250m² avec grand jardin de 500m² dans un quartier résidentiel calme d'Hammamet. 4 chambres, 3 salles de bains, salon avec cheminée, salle à manger, cuisine équipée, garage, piscine. Proche du centre-ville et des plages. Parfaite pour vacances en famille.",
    prix: 480000,
    surface: 250,
    nombre_pieces: 6,
    nombre_chambres: 4,
    nombre_salles_bain: 3,
    type_bien: "Villa",
    statut: "vente",
    adresse: "Zone Touristique, Hammamet",
    ville: "Hammamet",
    code_postal: "8050",
    latitude: 36.4000,
    longitude: 10.6167,
    proprietaire_id: 4,
    images: JSON.stringify(["/uploads/properties/villa-hammamet-1.jpg", "/uploads/properties/villa-hammamet-2.jpg"])
  },
  {
    titre: "Local Commercial Centre-Ville - Monastir",
    description: "Local commercial de 80m² en rez-de-chaussée dans une rue passante du centre-ville de Monastir. Vitrine sur rue, climatisation, sanitaires, possibilité d'aménagement selon activité. Idéal pour commerce de détail, bureau, cabinet médical. Forte affluence piétonne.",
    prix: 1200,
    surface: 80,
    nombre_pieces: 2,
    nombre_chambres: 0,
    nombre_salles_bain: 1,
    type_bien: "Local commercial",
    statut: "location",
    adresse: "Avenue de l'Indépendance, Monastir",
    ville: "Monastir",
    code_postal: "5000",
    latitude: 35.7643,
    longitude: 10.8113,
    proprietaire_id: 5,
    images: JSON.stringify(["/uploads/properties/local-monastir-1.jpg"])
  }
];

// Nouveaux utilisateurs vendeurs
const newUsers = [
  {
    nom: "Trabelsi",
    prenom: "Ahmed",
    email: "ahmed.trabelsi@email.com",
    mot_de_passe: "password123",
    role: "vendeur",
    telephone: "+216 22 345 678",
    adresse: "Rue de la Liberté, Sousse"
  },
  {
    nom: "Khelifi",
    prenom: "Sonia",
    email: "sonia.khelifi@email.com",
    mot_de_passe: "password123",
    role: "vendeur",
    telephone: "+216 25 987 654",
    adresse: "Avenue Bourguiba, Sfax"
  },
  {
    nom: "Admin",
    prenom: "Super",
    email: "superadmin@karya.tn",
    mot_de_passe: "admin123",
    role: "admin",
    telephone: "+216 20 000 000",
    adresse: "Siège Social Karya.tn, Tunis"
  }
];

async function populateDatabase() {
  try {
    console.log('🚀 Début du remplissage de la base de données...');

    // 1. Créer les nouveaux utilisateurs
    console.log('👥 Création des nouveaux utilisateurs...');
    
    for (const user of newUsers) {
      const hashedPassword = await bcrypt.hash(user.mot_de_passe, 10);
      
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone, date_creation)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      
      const result = stmt.run(
        user.nom,
        user.prenom,
        user.email,
        hashedPassword,
        user.role,
        user.telephone
      );
      
      if (result.changes > 0) {
        console.log(`✅ Utilisateur créé: ${user.prenom} ${user.nom} (${user.email})`);
      } else {
        console.log(`ℹ️  Utilisateur existe déjà: ${user.email}`);
      }
    }

    // 2. Créer les propriétés
    console.log('🏠 Création des propriétés...');
    
    for (const property of sampleProperties) {
      const stmt = db.prepare(`
        INSERT INTO biens (
          titre, description, prix, surface, nombre_pieces, nombre_chambres,
          nombre_salles_bain, type_bien, statut, adresse_complete, ville, code_postal,
          latitude, longitude, proprietaire_id, images, date_publication, date_modification
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      
      const result = stmt.run(
        property.titre,
        property.description,
        property.prix,
        property.surface,
        property.nombre_pieces,
        property.nombre_chambres,
        property.nombre_salles_bain,
        property.type_bien,
        property.statut,
        property.adresse,
        property.ville,
        property.code_postal,
        property.latitude,
        property.longitude,
        property.proprietaire_id,
        property.images
      );
      
      if (result.changes > 0) {
        console.log(`✅ Propriété créée: ${property.titre}`);
      }
    }

    // 3. Vérifier les données créées
    console.log('\n📊 Résumé des données créées:');
    
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM utilisateurs').get();
    console.log(`👥 Total utilisateurs: ${usersCount.count}`);
    
    const propertiesCount = db.prepare('SELECT COUNT(*) as count FROM biens').get();
    console.log(`🏠 Total propriétés: ${propertiesCount.count}`);
    
    const vendorsCount = db.prepare("SELECT COUNT(*) as count FROM utilisateurs WHERE role = 'vendeur'").get();
    console.log(`🏪 Vendeurs: ${vendorsCount.count}`);
    
    const adminsCount = db.prepare("SELECT COUNT(*) as count FROM utilisateurs WHERE role = 'admin'").get();
    console.log(`👨‍💼 Admins: ${adminsCount.count}`);
    
    const buyersCount = db.prepare("SELECT COUNT(*) as count FROM utilisateurs WHERE role = 'acheteur'").get();
    console.log(`🛒 Acheteurs: ${buyersCount.count}`);

    // 4. Afficher les comptes de test
    console.log('\n🔑 Comptes de test disponibles:');
    console.log('👨‍💼 Super Admin: superadmin@karya.tn / admin123');
    console.log('👨‍💼 Admin: admin@karya.tn / password123');
    console.log('🏪 Vendeur 1: mohamed.benali@email.com / password123');
    console.log('🏪 Vendeur 2: ahmed.trabelsi@email.com / password123');
    console.log('🏪 Vendeur 3: sonia.khelifi@email.com / password123');
    console.log('🛒 Acheteur: leila.bouazizi@email.com / password123');

    console.log('\n🎉 Base de données remplie avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du remplissage de la base de données:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  populateDatabase().then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
}

module.exports = { populateDatabase };
