-- Création de la base de données
CREATE DATABASE IF NOT EXISTS karya_tn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE karya_tn;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    role ENUM('acheteur','vendeur','admin') NOT NULL DEFAULT 'acheteur',
    telephone VARCHAR(20) NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('actif','inactif') DEFAULT 'actif',
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Table des biens immobiliers
CREATE TABLE IF NOT EXISTS biens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proprietaire_id INT NOT NULL,
    titre VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type_bien ENUM('maison','immeuble','villa','appartement','terrain') NOT NULL,
    statut ENUM('location','vente') NOT NULL,
    prix DECIMAL(12,2) NOT NULL,
    modalite_paiement ENUM('mensuel','trimestriel','annuel','unique') NOT NULL,
    surface DECIMAL(8,2) NOT NULL,
    nombre_pieces INT NOT NULL,
    adresse_complete VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    code_postal VARCHAR(20) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    date_publication DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut_publication ENUM('brouillon','publie','archive','refuse') DEFAULT 'publie',
    FOREIGN KEY (proprietaire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_proprietaire (proprietaire_id),
    INDEX idx_ville (ville),
    INDEX idx_type_bien (type_bien),
    INDEX idx_statut (statut),
    INDEX idx_prix (prix),
    INDEX idx_statut_publication (statut_publication)
);

-- Table des photos des biens
CREATE TABLE IF NOT EXISTS photos_biens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bien_id INT NOT NULL,
    url_image VARCHAR(255) NOT NULL,
    est_principale TINYINT(1) DEFAULT 0,
    date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
    INDEX idx_bien_id (bien_id),
    INDEX idx_principale (est_principale)
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    acheteur_id INT NOT NULL,
    vendeur_id INT NOT NULL,
    bien_id INT NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_derniere_message DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('active','fermee') DEFAULT 'active',
    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation (acheteur_id, vendeur_id, bien_id),
    INDEX idx_acheteur (acheteur_id),
    INDEX idx_vendeur (vendeur_id),
    INDEX idx_bien (bien_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    expediteur_id INT NOT NULL,
    contenu TEXT NOT NULL,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    lu TINYINT(1) DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (expediteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_expediteur (expediteur_id),
    INDEX idx_date_envoi (date_envoi)
);

-- Table des créneaux de visite
CREATE TABLE IF NOT EXISTS creneaux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendeur_id INT NOT NULL,
    bien_id INT NOT NULL,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    statut ENUM('libre','en_attente','confirme','annule') DEFAULT 'libre',
    acheteur_id INT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_vendeur (vendeur_id),
    INDEX idx_bien (bien_id),
    INDEX idx_acheteur (acheteur_id),
    INDEX idx_date_debut (date_debut),
    INDEX idx_statut (statut)
);

-- Table des préférences acheteur
CREATE TABLE IF NOT EXISTS preferences_acheteur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    acheteur_id INT NOT NULL,
    statut_recherche ENUM('location','achat') NOT NULL,
    budget_min DECIMAL(12,2) NULL,
    budget_max DECIMAL(12,2) NULL,
    type_bien_prefere VARCHAR(50) NULL,
    surface_min DECIMAL(8,2) NULL,
    nombre_pieces_min INT NULL,
    ville_preferee VARCHAR(100) NULL,
    date_mise_a_jour DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_acheteur (acheteur_id),
    INDEX idx_statut_recherche (statut_recherche),
    INDEX idx_ville_preferee (ville_preferee)
);

-- Table des suggestions
CREATE TABLE IF NOT EXISTS suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    acheteur_id INT NOT NULL,
    bien_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    date_suggestion DATETIME DEFAULT CURRENT_TIMESTAMP,
    vue TINYINT(1) DEFAULT 0,
    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE,
    UNIQUE KEY unique_suggestion (acheteur_id, bien_id),
    INDEX idx_acheteur (acheteur_id),
    INDEX idx_bien (bien_id),
    INDEX idx_score (score DESC),
    INDEX idx_date_suggestion (date_suggestion)
);

-- Table des sponsors
CREATE TABLE IF NOT EXISTS sponsors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_affichage ENUM('banner','carousel') NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    lien_externe VARCHAR(255) NULL,
    ordre_affichage INT DEFAULT 0,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut ENUM('actif','inactif') DEFAULT 'actif',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type_affichage (type_affichage),
    INDEX idx_statut (statut),
    INDEX idx_ordre (ordre_affichage),
    INDEX idx_dates (date_debut, date_fin)
);
