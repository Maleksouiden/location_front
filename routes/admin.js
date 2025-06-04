const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database-sqlite');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware pour vérifier le rôle admin
const requireAdmin = requireRole('admin');

// Validation pour les sponsors
const sponsorValidation = [
  body('type_affichage').isIn(['banner', 'carousel']).withMessage('Type d\'affichage invalide'),
  body('image_url').isURL().withMessage('URL d\'image invalide'),
  body('lien_externe').optional().isURL().withMessage('Lien externe invalide'),
  body('date_debut').isISO8601().withMessage('Date de début invalide'),
  body('date_fin').isISO8601().withMessage('Date de fin invalide'),
  body('ordre_affichage').optional().isInt({ min: 0 }).withMessage('Ordre d\'affichage invalide')
];

// GET /api/admin/dashboard - Tableau de bord admin
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Statistiques générales
    const stats = await Promise.all([
      query('SELECT COUNT(*) as total FROM utilisateurs'),
      query('SELECT COUNT(*) as total FROM utilisateurs WHERE role = ?', ['acheteur']),
      query('SELECT COUNT(*) as total FROM utilisateurs WHERE role = ?', ['vendeur']),
      query('SELECT COUNT(*) as total FROM biens'),
      query('SELECT COUNT(*) as total FROM biens WHERE statut_publication = ?', ['publie']),
      query('SELECT COUNT(*) as total FROM conversations'),
      query('SELECT COUNT(*) as total FROM creneaux WHERE statut = ?', ['confirme']),
      query('SELECT COUNT(*) as total FROM sponsors WHERE statut = ?', ['actif'])
    ]);

    const dashboard = {
      utilisateurs: {
        total: stats[0][0].total,
        acheteurs: stats[1][0].total,
        vendeurs: stats[2][0].total
      },
      biens: {
        total: stats[3][0].total,
        publies: stats[4][0].total
      },
      activite: {
        conversations: stats[5][0].total,
        rdv_confirmes: stats[6][0].total
      },
      sponsors: {
        actifs: stats[7][0].total
      }
    };

    // Statistiques par mois (derniers 6 mois)
    const monthlyStats = await query(`
      SELECT 
        strftime('%Y-%m', date_creation) as mois,
        COUNT(*) as nouveaux_utilisateurs
      FROM utilisateurs 
      WHERE date_creation >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date_creation)
      ORDER BY mois DESC
    `);

    const monthlyBiens = await query(`
      SELECT 
        strftime('%Y-%m', date_publication) as mois,
        COUNT(*) as nouveaux_biens
      FROM biens 
      WHERE date_publication >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date_publication)
      ORDER BY mois DESC
    `);

    res.json({
      dashboard,
      statistiques_mensuelles: {
        utilisateurs: monthlyStats,
        biens: monthlyBiens
      }
    });

  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération du tableau de bord'
    });
  }
});

// GET /api/admin/utilisateurs - Liste des utilisateurs
router.get('/utilisateurs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, statut, page = 1, limit = 20, search } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }
    if (statut) {
      whereConditions.push('statut = ?');
      queryParams.push(statut);
    }
    if (search) {
      whereConditions.push('(nom LIKE ? OR prenom LIKE ? OR email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM utilisateurs ${whereClause}`;
    const totalResult = await query(countQuery, queryParams);

    // Récupérer les utilisateurs
    const usersQuery = `
      SELECT 
        id, nom, prenom, email, role, telephone, date_creation, statut,
        (SELECT COUNT(*) FROM biens WHERE proprietaire_id = utilisateurs.id) as nb_biens,
        (SELECT COUNT(*) FROM conversations WHERE acheteur_id = utilisateurs.id OR vendeur_id = utilisateurs.id) as nb_conversations
      FROM utilisateurs 
      ${whereClause}
      ORDER BY date_creation DESC
      LIMIT ? OFFSET ?
    `;

    const users = await query(usersQuery, [...queryParams, parseInt(limit), offset]);

    res.json({
      utilisateurs: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erreur liste utilisateurs admin:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// PUT /api/admin/utilisateurs/:id/statut - Modifier le statut d'un utilisateur
router.put('/utilisateurs/:id/statut', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { statut } = req.body;

    // Valider que l'ID est un nombre entier
    if (!Number.isInteger(parseInt(userId)) || parseInt(userId) <= 0) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID de l\'utilisateur doit être un nombre entier positif'
      });
    }

    if (!['actif', 'inactif'].includes(statut)) {
      return res.status(400).json({
        error: 'Statut invalide',
        message: 'Le statut doit être "actif" ou "inactif"'
      });
    }

    // Vérifier que l'utilisateur existe
    const users = await query('SELECT id FROM utilisateurs WHERE id = ?', [parseInt(userId)]);
    if (users.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'L\'utilisateur demandé n\'existe pas'
      });
    }

    // Mettre à jour le statut
    await query('UPDATE utilisateurs SET statut = ? WHERE id = ?', [statut, parseInt(userId)]);

    res.json({
      message: `Statut de l'utilisateur mis à jour: ${statut}`
    });

  } catch (error) {
    console.error('Erreur modification statut utilisateur:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la modification du statut'
    });
  }
});

// GET /api/admin/biens - Liste des biens pour modération
router.get('/biens', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { statut_publication, type_bien, ville, page = 1, limit = 20 } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (statut_publication) {
      whereConditions.push('b.statut_publication = ?');
      queryParams.push(statut_publication);
    }
    if (type_bien) {
      whereConditions.push('b.type_bien = ?');
      queryParams.push(type_bien);
    }
    if (ville) {
      whereConditions.push('b.ville LIKE ?');
      queryParams.push(`%${ville}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM biens b ${whereClause}`;
    const totalResult = await query(countQuery, queryParams);

    // Récupérer les biens
    const biensQuery = `
      SELECT 
        b.*,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.email as proprietaire_email,
        (SELECT COUNT(*) FROM conversations WHERE bien_id = b.id) as nb_conversations
      FROM biens b
      JOIN utilisateurs u ON b.proprietaire_id = u.id
      ${whereClause}
      ORDER BY b.date_publication DESC
      LIMIT ? OFFSET ?
    `;

    const biens = await query(biensQuery, [...queryParams, parseInt(limit), offset]);

    res.json({
      biens: biens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erreur liste biens admin:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des biens'
    });
  }
});

// PUT /api/admin/biens/:id/valider - Valider ou refuser un bien
router.put('/biens/:id/valider', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bienId = req.params.id;
    const { statut } = req.body;

    if (!['publie', 'refuse', 'archive'].includes(statut)) {
      return res.status(400).json({
        error: 'Statut invalide',
        message: 'Le statut doit être "publie", "refuse" ou "archive"'
      });
    }

    // Vérifier que le bien existe
    const biens = await query('SELECT id FROM biens WHERE id = ?', [bienId]);
    if (biens.length === 0) {
      return res.status(404).json({
        error: 'Bien non trouvé',
        message: 'Le bien demandé n\'existe pas'
      });
    }

    // Mettre à jour le statut
    await query('UPDATE biens SET statut_publication = ? WHERE id = ?', [statut, bienId]);

    res.json({
      message: `Statut du bien mis à jour: ${statut}`
    });

  } catch (error) {
    console.error('Erreur validation bien:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la validation du bien'
    });
  }
});

// GET /api/admin/sponsors - Liste des sponsors
router.get('/sponsors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { statut, type_affichage } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (statut) {
      whereConditions.push('statut = ?');
      queryParams.push(statut);
    }
    if (type_affichage) {
      whereConditions.push('type_affichage = ?');
      queryParams.push(type_affichage);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const sponsors = await query(`
      SELECT * FROM sponsors 
      ${whereClause}
      ORDER BY ordre_affichage ASC, date_creation DESC
    `, queryParams);

    res.json({
      sponsors: sponsors
    });

  } catch (error) {
    console.error('Erreur liste sponsors:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des sponsors'
    });
  }
});

// POST /api/admin/sponsors - Créer un sponsor
router.post('/sponsors', authenticateToken, requireAdmin, sponsorValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const {
      type_affichage,
      image_url,
      lien_externe,
      date_debut,
      date_fin,
      ordre_affichage = 0
    } = req.body;

    // Vérifier que les dates sont cohérentes
    if (new Date(date_debut) >= new Date(date_fin)) {
      return res.status(400).json({
        error: 'Dates invalides',
        message: 'La date de fin doit être postérieure à la date de début'
      });
    }

    const result = await query(`
      INSERT INTO sponsors (
        type_affichage, image_url, lien_externe, date_debut, date_fin, ordre_affichage
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [type_affichage, image_url, lien_externe, date_debut, date_fin, ordre_affichage]);

    // Récupérer le sponsor créé
    const nouveauSponsor = await query('SELECT * FROM sponsors WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Sponsor créé avec succès',
      sponsor: nouveauSponsor[0]
    });

  } catch (error) {
    console.error('Erreur création sponsor:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la création du sponsor'
    });
  }
});

// PUT /api/admin/sponsors/:id - Modifier un sponsor
router.put('/sponsors/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sponsorId = req.params.id;
    const { statut, date_fin, ordre_affichage } = req.body;

    // Vérifier que le sponsor existe
    const sponsors = await query('SELECT id FROM sponsors WHERE id = ?', [sponsorId]);
    if (sponsors.length === 0) {
      return res.status(404).json({
        error: 'Sponsor non trouvé',
        message: 'Le sponsor demandé n\'existe pas'
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (statut) {
      if (!['actif', 'inactif'].includes(statut)) {
        return res.status(400).json({
          error: 'Statut invalide',
          message: 'Le statut doit être "actif" ou "inactif"'
        });
      }
      updateFields.push('statut = ?');
      updateValues.push(statut);
    }

    if (date_fin) {
      updateFields.push('date_fin = ?');
      updateValues.push(date_fin);
    }

    if (ordre_affichage !== undefined) {
      updateFields.push('ordre_affichage = ?');
      updateValues.push(ordre_affichage);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Aucune donnée à mettre à jour',
        message: 'Veuillez fournir au moins un champ à modifier'
      });
    }

    updateValues.push(sponsorId);

    await query(
      `UPDATE sponsors SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Récupérer le sponsor mis à jour
    const sponsorMisAJour = await query('SELECT * FROM sponsors WHERE id = ?', [sponsorId]);

    res.json({
      message: 'Sponsor mis à jour avec succès',
      sponsor: sponsorMisAJour[0]
    });

  } catch (error) {
    console.error('Erreur modification sponsor:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la modification du sponsor'
    });
  }
});

// DELETE /api/admin/sponsors/:id - Supprimer un sponsor
router.delete('/sponsors/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sponsorId = req.params.id;

    // Vérifier que le sponsor existe
    const sponsors = await query('SELECT id FROM sponsors WHERE id = ?', [sponsorId]);
    if (sponsors.length === 0) {
      return res.status(404).json({
        error: 'Sponsor non trouvé',
        message: 'Le sponsor demandé n\'existe pas'
      });
    }

    await query('DELETE FROM sponsors WHERE id = ?', [sponsorId]);

    res.json({
      message: 'Sponsor supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression sponsor:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la suppression du sponsor'
    });
  }
});

module.exports = router;
