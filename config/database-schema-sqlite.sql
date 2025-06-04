-- Création des tables SQLite pour Karya.tn

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    role TEXT CHECK(role IN ('acheteur','vendeur','admin')) NOT NULL DEFAULT 'acheteur',
    telephone VARCHAR(20),
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut TEXT CHECK(statut IN ('actif','inactif')) DEFAULT 'actif'
);

-- Index pour la table utilisateurs
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);

-- Table des biens immobiliers
CREATE TABLE IF NOT EXISTS biens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proprietaire_id INTEGER NOT NULL,
    titre VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type_bien TEXT CHECK(type_bien IN ('maison','immeuble','villa','appartement','terrain')) NOT NULL,
    statut TEXT CHECK(statut IN ('location','vente')) NOT NULL,
    prix DECIMAL(12,2) NOT NULL,
    modalite_paiement TEXT CHECK(modalite_paiement IN ('mensuel','trimestriel','annuel','unique')) NOT NULL,
    surface DECIMAL(8,2) NOT NULL,
    nombre_pieces INTEGER NOT NULL,
    adresse_complete VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    code_postal VARCHAR(20) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    date_publication DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut_publication TEXT CHECK(statut_publication IN ('brouillon','publie','archive','refuse')) DEFAULT 'publie',
    FOREIGN KEY (proprietaire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Index pour la table biens
CREATE INDEX IF NOT EXISTS idx_biens_proprietaire ON biens(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_biens_ville ON biens(ville);
CREATE INDEX IF NOT EXISTS idx_biens_type_bien ON biens(type_bien);
CREATE INDEX IF NOT EXISTS idx_biens_statut ON biens(statut);
CREATE INDEX IF NOT EXISTS idx_biens_prix ON biens(prix);
CREATE INDEX IF NOT EXISTS idx_biens_statut_publication ON biens(statut_publication);

-- Table des photos des biens
CREATE TABLE IF NOT EXISTS photos_biens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bien_id INTEGER NOT NULL,
    url_image VARCHAR(255) NOT NULL,
    est_principale INTEGER DEFAULT 0,
    date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE
);

-- Index pour la table photos_biens
CREATE INDEX IF NOT EXISTS idx_photos_biens_bien_id ON photos_biens(bien_id);
CREATE INDEX IF NOT EXISTS idx_photos_biens_principale ON photos_biens(est_principale);

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    acheteur_id INTEGER NOT NULL,
    vendeur_id INTEGER NOT NULL,
    bien_id INTEGER NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_derniere_message DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut TEXT CHECK(statut IN ('active','fermee')) DEFAULT 'active',
    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
    UNIQUE(acheteur_id, vendeur_id, bien_id)
);

-- Index pour la table conversations
CREATE INDEX IF NOT EXISTS idx_conversations_acheteur ON conversations(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendeur ON conversations(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_conversations_bien ON conversations(bien_id);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    expediteur_id INTEGER NOT NULL,
    contenu TEXT NOT NULL,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    lu INTEGER DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (expediteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Index pour la table messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_date_envoi ON messages(date_envoi);

-- Table des créneaux de visite
CREATE TABLE IF NOT EXISTS creneaux (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendeur_id INTEGER NOT NULL,
    bien_id INTEGER NOT NULL,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    statut TEXT CHECK(statut IN ('libre','en_attente','confirme','annule')) DEFAULT 'libre',
    acheteur_id INTEGER,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- Index pour la table creneaux
CREATE INDEX IF NOT EXISTS idx_creneaux_vendeur ON creneaux(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_creneaux_bien ON creneaux(bien_id);
CREATE INDEX IF NOT EXISTS idx_creneaux_acheteur ON creneaux(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_creneaux_date_debut ON creneaux(date_debut);
CREATE INDEX IF NOT EXISTS idx_creneaux_statut ON creneaux(statut);

-- Table des préférences acheteur
CREATE TABLE IF NOT EXISTS preferences_acheteur (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    acheteur_id INTEGER NOT NULL,
    statut_recherche TEXT CHECK(statut_recherche IN ('location','achat')) NOT NULL,
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    type_bien_prefere VARCHAR(50),
    surface_min DECIMAL(8,2),
    nombre_pieces_min INTEGER,
    ville_preferee VARCHAR(100),
    date_mise_a_jour DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    UNIQUE(acheteur_id)
);

-- Index pour la table preferences_acheteur
CREATE INDEX IF NOT EXISTS idx_preferences_acheteur_statut_recherche ON preferences_acheteur(statut_recherche);
CREATE INDEX IF NOT EXISTS idx_preferences_acheteur_ville_preferee ON preferences_acheteur(ville_preferee);

-- Table des suggestions
CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    acheteur_id INTEGER NOT NULL,
    bien_id INTEGER NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    date_suggestion DATETIME DEFAULT CURRENT_TIMESTAMP,
    vue INTEGER DEFAULT 0,
    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
    UNIQUE(acheteur_id, bien_id)
);

-- Index pour la table suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_acheteur ON suggestions(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_bien ON suggestions(bien_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_score ON suggestions(score DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_date_suggestion ON suggestions(date_suggestion);

-- Table des sponsors
CREATE TABLE IF NOT EXISTS sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_affichage TEXT CHECK(type_affichage IN ('banner','carousel')) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    lien_externe VARCHAR(255),
    ordre_affichage INTEGER DEFAULT 0,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut TEXT CHECK(statut IN ('actif','inactif')) DEFAULT 'actif',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour la table sponsors
CREATE INDEX IF NOT EXISTS idx_sponsors_type_affichage ON sponsors(type_affichage);
CREATE INDEX IF NOT EXISTS idx_sponsors_statut ON sponsors(statut);
CREATE INDEX IF NOT EXISTS idx_sponsors_ordre ON sponsors(ordre_affichage);
CREATE INDEX IF NOT EXISTS idx_sponsors_dates ON sponsors(date_debut, date_fin);
