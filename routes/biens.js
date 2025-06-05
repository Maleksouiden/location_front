const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../config/database-sqlite');
const { authenticateToken, requireVendeur, requireOwnership } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Le middleware requireVendeur est importé depuis ../middleware/auth

// Le middleware requireOwnership est importé depuis ../middleware/auth

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/properties';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images JPEG, PNG et WebP sont autorisées'));
    }
  }
});

// Validation pour la création/modification d'un bien
const bienValidation = [
  body('titre').trim().isLength({ min: 5, max: 150 }).withMessage('Le titre doit contenir entre 5 et 150 caractères'),
  body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('La description doit contenir entre 20 et 2000 caractères'),
  body('type_bien').isIn(['maison', 'immeuble', 'villa', 'appartement', 'terrain']).withMessage('Type de bien invalide'),
  body('statut').isIn(['location', 'vente']).withMessage('Statut invalide (location ou vente)'),
  body('prix').isFloat({ min: 0.01 }).withMessage('Le prix doit être un nombre positif supérieur à 0'),
  body('modalite_paiement').isIn(['mensuel', 'trimestriel', 'annuel', 'unique']).withMessage('Modalité de paiement invalide'),
  body('surface').isFloat({ min: 0.01 }).withMessage('La surface doit être un nombre positif supérieur à 0'),
  body('nombre_pieces').isInt({ min: 0 }).withMessage('Le nombre de pièces doit être un entier positif ou nul'),
  body('adresse_complete').trim().isLength({ min: 10, max: 255 }).withMessage('L\'adresse doit contenir entre 10 et 255 caractères'),
  body('ville').trim().isLength({ min: 2, max: 100 }).withMessage('La ville doit contenir entre 2 et 100 caractères'),
  body('code_postal').trim().isLength({ min: 4, max: 20 }).withMessage('Le code postal doit contenir entre 4 et 20 caractères'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide')
];

// GET /api/biens/mes-biens - Mes biens (vendeur)
router.get('/mes-biens', authenticateToken, requireVendeur, async (req, res) => {
  try {
    const biens = await query(`
      SELECT
        b.*,
        (SELECT COUNT(*) FROM conversations c WHERE c.bien_id = b.id) as nb_conversations,
        (SELECT url_image FROM photos_biens WHERE bien_id = b.id AND est_principale = 1 LIMIT 1) as photo_principale
      FROM biens b
      WHERE b.proprietaire_id = ?
      ORDER BY b.date_publication DESC
    `, [req.user.id]);

    // Récupérer toutes les images pour chaque bien
    for (let bien of biens) {
      const photos = await query(
        'SELECT url_image FROM photos_biens WHERE bien_id = ? ORDER BY est_principale DESC, id ASC',
        [bien.id]
      );
      bien.images = photos.map(photo => photo.url_image);
    }

    res.json({
      biens: biens
    });

  } catch (error) {
    console.error('Erreur récupération mes biens:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération de vos biens'
    });
  }
});

// GET /api/biens - Liste des biens avec filtres
router.get('/', async (req, res) => {
  try {
    const {
      ville,
      type_bien,
      statut,
      prix_min,
      prix_max,
      surface_min,
      nombre_pieces_min,
      page = 1,
      limit = 20
    } = req.query;

    // Construction de la requête avec filtres
    let whereConditions = ['b.statut_publication = ?'];
    let queryParams = ['publie'];

    if (ville) {
      whereConditions.push('b.ville LIKE ?');
      queryParams.push(`%${ville}%`);
    }
    if (type_bien) {
      whereConditions.push('b.type_bien = ?');
      queryParams.push(type_bien);
    }
    if (statut) {
      whereConditions.push('b.statut = ?');
      queryParams.push(statut);
    }
    if (prix_min) {
      whereConditions.push('b.prix >= ?');
      queryParams.push(parseFloat(prix_min));
    }
    if (prix_max) {
      whereConditions.push('b.prix <= ?');
      queryParams.push(parseFloat(prix_max));
    }
    if (surface_min) {
      whereConditions.push('b.surface >= ?');
      queryParams.push(parseFloat(surface_min));
    }
    if (nombre_pieces_min) {
      whereConditions.push('b.nombre_pieces >= ?');
      queryParams.push(parseInt(nombre_pieces_min));
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Requête pour compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM biens b
      WHERE ${whereClause}
    `;

    const totalResult = await query(countQuery, queryParams);

    let total = 0;
    if (totalResult && Array.isArray(totalResult) && totalResult.length > 0 && totalResult[0]) {
      total = totalResult[0].total || 0;
    }

    // Requête principale avec pagination
    const mainQuery = `
      SELECT
        b.*,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.telephone as proprietaire_telephone,
        (SELECT url_image FROM photos_biens WHERE bien_id = b.id AND est_principale = 1 LIMIT 1) as photo_principale
      FROM biens b
      JOIN utilisateurs u ON b.proprietaire_id = u.id
      WHERE ${whereClause}
      ORDER BY b.date_publication DESC
      LIMIT ? OFFSET ?
    `;

    const biens = await query(mainQuery, [...queryParams, parseInt(limit), offset]);

    // Récupérer toutes les images pour chaque bien
    for (let bien of biens) {
      const photos = await query(
        'SELECT url_image FROM photos_biens WHERE bien_id = ? ORDER BY est_principale DESC, id ASC',
        [bien.id]
      );
      bien.images = photos.map(photo => photo.url_image);
    }

    res.json({
      biens: biens,
      total: total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        ville,
        type_bien,
        statut,
        prix_min,
        prix_max,
        surface_min,
        nombre_pieces_min
      }
    });

  } catch (error) {
    console.error('Erreur récupération biens:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des biens'
    });
  }
});

// GET /api/biens/:id - Détail d'un bien
router.get('/:id', async (req, res) => {
  try {
    const bienId = req.params.id;

    // Valider que l'ID est un nombre entier
    const parsedId = parseInt(bienId);
    if (isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID du bien doit être un nombre entier positif'
      });
    }

    // Récupérer le bien avec les infos du propriétaire
    const biens = await query(`
      SELECT
        b.*,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.telephone as proprietaire_telephone,
        u.email as proprietaire_email
      FROM biens b
      JOIN utilisateurs u ON b.proprietaire_id = u.id
      WHERE b.id = ? AND b.statut_publication = ?
    `, [parsedId, 'publie']);

    if (biens.length === 0) {
      return res.status(404).json({
        error: 'Bien non trouvé',
        message: 'Le bien demandé n\'existe pas ou n\'est pas publié'
      });
    }

    const bien = biens[0];

    // Récupérer les photos
    const photos = await query(
      'SELECT id, url_image, est_principale FROM photos_biens WHERE bien_id = ? ORDER BY est_principale DESC, id ASC',
      [parsedId]
    );

    // Ajouter les images au bien
    bien.images = photos.map(photo => photo.url_image);

    res.json({
      bien: bien,
      photos: photos
    });

  } catch (error) {
    console.error('Erreur récupération bien:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération du bien'
    });
  }
});

// POST /api/biens - Créer un nouveau bien
router.post('/', authenticateToken, requireVendeur, bienValidation, async (req, res) => {
  try {
    console.log('🏠 POST /api/biens - Début création bien');
    console.log('👤 Utilisateur:', req.user);
    console.log('📝 Données reçues:', req.body);

    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Erreurs de validation:', errors.array());
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const {
      titre, description, type_bien, statut, prix, modalite_paiement,
      surface, nombre_pieces, adresse_complete, ville, code_postal,
      latitude, longitude
    } = req.body;

    console.log('💾 Insertion en base de données...');
    const result = await query(`
      INSERT INTO biens (
        proprietaire_id, titre, description, type_bien, statut, prix,
        modalite_paiement, surface, nombre_pieces, adresse_complete,
        ville, code_postal, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, titre, description, type_bien, statut, prix,
      modalite_paiement, surface, nombre_pieces, adresse_complete,
      ville, code_postal, latitude, longitude
    ]);

    console.log('✅ Insertion réussie, ID:', result.insertId);

    // Récupérer le bien créé
    const nouveauBien = await query(
      'SELECT * FROM biens WHERE id = ?',
      [result.insertId]
    );

    console.log('📋 Bien créé:', nouveauBien[0]);

    res.status(201).json({
      message: 'Bien créé avec succès',
      bien: nouveauBien[0]
    });

  } catch (error) {
    console.error('❌ Erreur création bien:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la création du bien'
    });
  }
});

// PUT /api/biens/:id - Modifier un bien
router.put('/:id', 
  authenticateToken, 
  requireOwnership('id', 'proprietaire_id', 'biens'),
  bienValidation, 
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const bienId = req.params.id;
      const {
        titre, description, type_bien, statut, prix, modalite_paiement,
        surface, nombre_pieces, adresse_complete, ville, code_postal,
        latitude, longitude
      } = req.body;

      await query(`
        UPDATE biens SET
          titre = ?, description = ?, type_bien = ?, statut = ?, prix = ?,
          modalite_paiement = ?, surface = ?, nombre_pieces = ?, adresse_complete = ?,
          ville = ?, code_postal = ?, latitude = ?, longitude = ?
        WHERE id = ?
      `, [
        titre, description, type_bien, statut, prix,
        modalite_paiement, surface, nombre_pieces, adresse_complete,
        ville, code_postal, latitude, longitude, bienId
      ]);

      // Récupérer le bien mis à jour
      const bienMisAJour = await query(
        'SELECT * FROM biens WHERE id = ?',
        [bienId]
      );

      res.json({
        message: 'Bien mis à jour avec succès',
        bien: bienMisAJour[0]
      });

    } catch (error) {
      console.error('Erreur modification bien:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la modification du bien'
      });
    }
  }
);

// DELETE /api/biens/:id - Supprimer un bien
router.delete('/:id', 
  authenticateToken, 
  requireOwnership('id', 'proprietaire_id', 'biens'),
  async (req, res) => {
    try {
      const bienId = req.params.id;

      await query('DELETE FROM biens WHERE id = ?', [bienId]);

      res.json({
        message: 'Bien supprimé avec succès'
      });

    } catch (error) {
      console.error('Erreur suppression bien:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression du bien'
      });
    }
  }
);

// POST /api/biens/:id/images - Upload d'images pour un bien
router.post('/:id/images',
  authenticateToken,
  requireOwnership('id', 'proprietaire_id', 'biens'),
  upload.single('image'),
  async (req, res) => {
    try {
      const bienId = req.params.id;

      if (!req.file) {
        return res.status(400).json({
          error: 'Aucun fichier',
          message: 'Aucune image n\'a été fournie'
        });
      }

      // Insérer l'image en base
      const result = await query(
        'INSERT INTO photos_biens (bien_id, url_image, est_principale) VALUES (?, ?, ?)',
        [bienId, req.file.path, false]
      );

      // Si c'est la première image, la marquer comme principale
      const existingPhotos = await query(
        'SELECT COUNT(*) as count FROM photos_biens WHERE bien_id = ?',
        [bienId]
      );

      if (existingPhotos[0].count === 1) {
        await query(
          'UPDATE photos_biens SET est_principale = 1 WHERE id = ?',
          [result.insertId]
        );
      }

      res.status(201).json({
        message: 'Image uploadée avec succès',
        image: {
          id: result.insertId,
          url: req.file.path,
          est_principale: existingPhotos[0].count === 1
        }
      });

    } catch (error) {
      console.error('Erreur upload image:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de l\'upload de l\'image'
      });
    }
  }
);

// DELETE /api/biens/:id/images/:imageId - Supprimer une image
router.delete('/:id/images/:imageId',
  authenticateToken,
  requireOwnership('id', 'proprietaire_id', 'biens'),
  async (req, res) => {
    try {
      const { id: bienId, imageId } = req.params;

      // Récupérer l'image
      const images = await query(
        'SELECT * FROM photos_biens WHERE id = ? AND bien_id = ?',
        [imageId, bienId]
      );

      if (images.length === 0) {
        return res.status(404).json({
          error: 'Image non trouvée',
          message: 'L\'image demandée n\'existe pas'
        });
      }

      const image = images[0];

      // Supprimer le fichier physique
      if (fs.existsSync(image.url_image)) {
        fs.unlinkSync(image.url_image);
      }

      // Supprimer de la base
      await query('DELETE FROM photos_biens WHERE id = ?', [imageId]);

      // Si c'était l'image principale, marquer une autre comme principale
      if (image.est_principale) {
        const otherImages = await query(
          'SELECT id FROM photos_biens WHERE bien_id = ? LIMIT 1',
          [bienId]
        );

        if (otherImages.length > 0) {
          await query(
            'UPDATE photos_biens SET est_principale = 1 WHERE id = ?',
            [otherImages[0].id]
          );
        }
      }

      res.json({
        message: 'Image supprimée avec succès'
      });

    } catch (error) {
      console.error('Erreur suppression image:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression de l\'image'
      });
    }
  }
);

module.exports = router;
