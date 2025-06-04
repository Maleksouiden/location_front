const bcrypt = require('bcrypt');
const { query } = require('../config/database-sqlite');

async function insertTestData() {
  console.log('🚀 Insertion des données de test...');

  try {
    // Hasher les mots de passe
    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. Créer des utilisateurs de test
    console.log('👥 Création des utilisateurs...');
    
    // Admin
    const adminResult = await query(`
      INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Admin', 'Karya', 'admin@karya.tn', hashedPassword, 'admin', '+216 20 123 456']);

    // Vendeurs
    const vendeur1Result = await query(`
      INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Ben Ali', 'Mohamed', 'mohamed.benali@email.com', hashedPassword, 'vendeur', '+216 22 345 678']);

    const vendeur2Result = await query(`
      INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Trabelsi', 'Fatma', 'fatma.trabelsi@email.com', hashedPassword, 'vendeur', '+216 23 456 789']);

    const vendeur3Result = await query(`
      INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Gharbi', 'Ahmed', 'ahmed.gharbi@email.com', hashedPassword, 'vendeur', '+216 24 567 890']);

    // Acheteurs
    const acheteur1Result = await query(`
      INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Bouazizi', 'Leila', 'leila.bouazizi@email.com', hashedPassword, 'acheteur', '+216 25 678 901']);

    const acheteur2Result = await query(`
      INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Khelifi', 'Sami', 'sami.khelifi@email.com', hashedPassword, 'acheteur', '+216 26 789 012']);

    const acheteur3Result = await query(`
      INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Mansouri', 'Nadia', 'nadia.mansouri@email.com', hashedPassword, 'acheteur', '+216 27 890 123']);

    console.log('✅ Utilisateurs créés');

    // 2. Créer des biens immobiliers
    console.log('🏠 Création des biens immobiliers...');

    const biens = [
      {
        proprietaire_id: vendeur1Result.insertId,
        titre: 'Villa moderne avec piscine - Sidi Bou Said',
        description: 'Magnifique villa de 300m² avec piscine, jardin paysager et vue mer. 5 chambres, 3 salles de bain, salon spacieux avec cheminée. Quartier résidentiel calme.',
        type_bien: 'villa',
        statut: 'vente',
        prix: 850000,
        modalite_paiement: 'unique',
        surface: 300,
        nombre_pieces: 8,
        adresse_complete: '15 Rue des Jasmins, Sidi Bou Said',
        ville: 'Sidi Bou Said',
        code_postal: '2026',
        latitude: 36.8675,
        longitude: 10.3467
      },
      {
        proprietaire_id: vendeur1Result.insertId,
        titre: 'Appartement F3 centre-ville Tunis',
        description: 'Appartement de 120m² au 4ème étage avec ascenseur. 3 chambres, 2 salles de bain, cuisine équipée, balcon avec vue sur la ville. Proche métro.',
        type_bien: 'appartement',
        statut: 'location',
        prix: 1200,
        modalite_paiement: 'mensuel',
        surface: 120,
        nombre_pieces: 5,
        adresse_complete: '45 Avenue Habib Bourguiba, Tunis',
        ville: 'Tunis',
        code_postal: '1000',
        latitude: 36.8065,
        longitude: 10.1815
      },
      {
        proprietaire_id: vendeur2Result.insertId,
        titre: 'Maison traditionnelle Sousse Médina',
        description: 'Charmante maison traditionnelle de 180m² dans la médina de Sousse. 4 chambres, patio central, terrasse sur le toit. Idéal pour investissement touristique.',
        type_bien: 'maison',
        statut: 'vente',
        prix: 320000,
        modalite_paiement: 'unique',
        surface: 180,
        nombre_pieces: 6,
        adresse_complete: '12 Rue de la Médina, Sousse',
        ville: 'Sousse',
        code_postal: '4000',
        latitude: 35.8256,
        longitude: 10.6369
      },
      {
        proprietaire_id: vendeur2Result.insertId,
        titre: 'Studio meublé Hammamet',
        description: 'Studio de 45m² entièrement meublé et équipé. Proche de la plage et du centre-ville. Idéal pour location saisonnière ou résidence secondaire.',
        type_bien: 'appartement',
        statut: 'location',
        prix: 800,
        modalite_paiement: 'mensuel',
        surface: 45,
        nombre_pieces: 2,
        adresse_complete: '8 Rue des Palmiers, Hammamet',
        ville: 'Hammamet',
        code_postal: '8050',
        latitude: 36.4000,
        longitude: 10.6167
      },
      {
        proprietaire_id: vendeur3Result.insertId,
        titre: 'Terrain constructible Sfax',
        description: 'Terrain de 500m² dans zone résidentielle. Toutes commodités à proximité. Idéal pour construction villa ou immeuble. Titre foncier en règle.',
        type_bien: 'terrain',
        statut: 'vente',
        prix: 180000,
        modalite_paiement: 'unique',
        surface: 500,
        nombre_pieces: 1,
        adresse_complete: 'Zone résidentielle El Ain, Sfax',
        ville: 'Sfax',
        code_postal: '3000',
        latitude: 34.7406,
        longitude: 10.7603
      },
      {
        proprietaire_id: vendeur3Result.insertId,
        titre: 'Immeuble de rapport Monastir',
        description: 'Immeuble de 4 étages avec 8 appartements. Entièrement loué, rentabilité 8% par an. Excellent état, ascenseur, parking.',
        type_bien: 'immeuble',
        statut: 'vente',
        prix: 1200000,
        modalite_paiement: 'unique',
        surface: 800,
        nombre_pieces: 24,
        adresse_complete: '25 Avenue de la République, Monastir',
        ville: 'Monastir',
        code_postal: '5000',
        latitude: 35.7643,
        longitude: 10.8113
      }
    ];

    const bienIds = [];
    for (const bien of biens) {
      const result = await query(`
        INSERT INTO biens (
          proprietaire_id, titre, description, type_bien, statut, prix,
          modalite_paiement, surface, nombre_pieces, adresse_complete,
          ville, code_postal, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bien.proprietaire_id, bien.titre, bien.description, bien.type_bien,
        bien.statut, bien.prix, bien.modalite_paiement, bien.surface,
        bien.nombre_pieces, bien.adresse_complete, bien.ville,
        bien.code_postal, bien.latitude, bien.longitude
      ]);
      bienIds.push(result.insertId);
    }

    console.log('✅ Biens immobiliers créés');

    // 3. Créer des photos de biens (URLs d'exemple)
    console.log('📸 Ajout des photos...');
    
    const photos = [
      { bien_id: bienIds[0], url_image: '/uploads/villa1_main.jpg', est_principale: 1 },
      { bien_id: bienIds[0], url_image: '/uploads/villa1_salon.jpg', est_principale: 0 },
      { bien_id: bienIds[0], url_image: '/uploads/villa1_piscine.jpg', est_principale: 0 },
      { bien_id: bienIds[1], url_image: '/uploads/appart1_main.jpg', est_principale: 1 },
      { bien_id: bienIds[1], url_image: '/uploads/appart1_salon.jpg', est_principale: 0 },
      { bien_id: bienIds[2], url_image: '/uploads/maison1_main.jpg', est_principale: 1 },
      { bien_id: bienIds[3], url_image: '/uploads/studio1_main.jpg', est_principale: 1 },
      { bien_id: bienIds[4], url_image: '/uploads/terrain1_main.jpg', est_principale: 1 },
      { bien_id: bienIds[5], url_image: '/uploads/immeuble1_main.jpg', est_principale: 1 }
    ];

    for (const photo of photos) {
      await query(
        'INSERT INTO photos_biens (bien_id, url_image, est_principale) VALUES (?, ?, ?)',
        [photo.bien_id, photo.url_image, photo.est_principale]
      );
    }

    console.log('✅ Photos ajoutées');

    // 4. Créer des préférences pour les acheteurs
    console.log('⚙️ Création des préférences acheteurs...');

    const preferences = [
      {
        acheteur_id: acheteur1Result.insertId,
        statut_recherche: 'achat',
        budget_min: 200000,
        budget_max: 500000,
        type_bien_prefere: 'appartement',
        surface_min: 80,
        nombre_pieces_min: 3,
        ville_preferee: 'Tunis'
      },
      {
        acheteur_id: acheteur2Result.insertId,
        statut_recherche: 'location',
        budget_min: 800,
        budget_max: 1500,
        type_bien_prefere: 'appartement',
        surface_min: 60,
        nombre_pieces_min: 2,
        ville_preferee: 'Sousse'
      },
      {
        acheteur_id: acheteur3Result.insertId,
        statut_recherche: 'achat',
        budget_min: 300000,
        budget_max: 800000,
        type_bien_prefere: 'villa',
        surface_min: 200,
        nombre_pieces_min: 5,
        ville_preferee: 'Sidi Bou Said'
      }
    ];

    for (const pref of preferences) {
      await query(`
        INSERT INTO preferences_acheteur (
          acheteur_id, statut_recherche, budget_min, budget_max,
          type_bien_prefere, surface_min, nombre_pieces_min, ville_preferee
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pref.acheteur_id, pref.statut_recherche, pref.budget_min, pref.budget_max,
        pref.type_bien_prefere, pref.surface_min, pref.nombre_pieces_min, pref.ville_preferee
      ]);
    }

    console.log('✅ Préférences créées');

    // 5. Créer des conversations et messages
    console.log('💬 Création des conversations...');

    // Conversation 1: Acheteur1 intéressé par l'appartement F3
    const conv1Result = await query(
      'INSERT INTO conversations (acheteur_id, vendeur_id, bien_id) VALUES (?, ?, ?)',
      [acheteur1Result.insertId, vendeur1Result.insertId, bienIds[1]]
    );

    await query(
      'INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [conv1Result.insertId, acheteur1Result.insertId, 'Bonjour, je suis intéressée par votre appartement F3. Serait-il possible de le visiter cette semaine ?']
    );

    await query(
      'INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [conv1Result.insertId, vendeur1Result.insertId, 'Bonjour Mme Bouazizi, bien sûr ! Je peux vous proposer une visite jeudi ou vendredi après-midi. Quelle heure vous conviendrait ?']
    );

    // Conversation 2: Acheteur2 intéressé par le studio
    const conv2Result = await query(
      'INSERT INTO conversations (acheteur_id, vendeur_id, bien_id) VALUES (?, ?, ?)',
      [acheteur2Result.insertId, vendeur2Result.insertId, bienIds[3]]
    );

    await query(
      'INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [conv2Result.insertId, acheteur2Result.insertId, 'Bonjour, le studio est-il toujours disponible ? Y a-t-il des charges en plus du loyer ?']
    );

    console.log('✅ Conversations créées');

    // 6. Créer des créneaux de visite
    console.log('📅 Création des créneaux...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Créneaux pour l'appartement F3
    await query(
      'INSERT INTO creneaux (vendeur_id, bien_id, date_debut, date_fin, statut) VALUES (?, ?, ?, ?, ?)',
      [vendeur1Result.insertId, bienIds[1], 
       tomorrow.toISOString().slice(0, 16) + ':00', 
       new Date(tomorrow.getTime() + 60*60*1000).toISOString().slice(0, 16) + ':00',
       'libre']
    );

    // Créneaux pour la villa
    await query(
      'INSERT INTO creneaux (vendeur_id, bien_id, date_debut, date_fin, statut, acheteur_id) VALUES (?, ?, ?, ?, ?, ?)',
      [vendeur1Result.insertId, bienIds[0], 
       nextWeek.toISOString().slice(0, 16) + ':00', 
       new Date(nextWeek.getTime() + 90*60*1000).toISOString().slice(0, 16) + ':00',
       'en_attente', acheteur3Result.insertId]
    );

    console.log('✅ Créneaux créés');

    // 7. Créer des sponsors
    console.log('🎯 Création des sponsors...');

    const sponsors = [
      {
        type_affichage: 'banner',
        image_url: 'https://example.com/banner1.jpg',
        lien_externe: 'https://banque-exemple.tn',
        ordre_affichage: 1,
        date_debut: new Date().toISOString().slice(0, 10),
        date_fin: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10)
      },
      {
        type_affichage: 'carousel',
        image_url: 'https://example.com/carousel1.jpg',
        lien_externe: 'https://assurance-exemple.tn',
        ordre_affichage: 1,
        date_debut: new Date().toISOString().slice(0, 10),
        date_fin: new Date(Date.now() + 60*24*60*60*1000).toISOString().slice(0, 10)
      }
    ];

    for (const sponsor of sponsors) {
      await query(`
        INSERT INTO sponsors (
          type_affichage, image_url, lien_externe, ordre_affichage, date_debut, date_fin
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        sponsor.type_affichage, sponsor.image_url, sponsor.lien_externe,
        sponsor.ordre_affichage, sponsor.date_debut, sponsor.date_fin
      ]);
    }

    console.log('✅ Sponsors créés');

    console.log('\n🎉 Données de test insérées avec succès !');
    console.log('\n📋 Comptes de test créés :');
    console.log('👨‍💼 Admin: admin@karya.tn / password123');
    console.log('🏪 Vendeur 1: mohamed.benali@email.com / password123');
    console.log('🏪 Vendeur 2: fatma.trabelsi@email.com / password123');
    console.log('🏪 Vendeur 3: ahmed.gharbi@email.com / password123');
    console.log('🛒 Acheteur 1: leila.bouazizi@email.com / password123');
    console.log('🛒 Acheteur 2: sami.khelifi@email.com / password123');
    console.log('🛒 Acheteur 3: nadia.mansouri@email.com / password123');

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error);
    throw error;
  }
}

// Exécuter l'insertion
insertTestData().catch(console.error);
