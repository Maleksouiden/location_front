const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database-sqlite');
const { authenticateToken, requireVendeur, requireAcheteur } = require('../middleware/auth');

const router = express.Router();

// Validation pour créer un créneau
const createCreneauValidation = [
  body('bien_id').isInt({ min: 1 }).withMessage('ID du bien invalide'),
  body('date_debut').isISO8601().withMessage('Date de début invalide'),
  body('date_fin').isISO8601().withMessage('Date de fin invalide')
];

// GET /api/creneaux - Créneaux du vendeur connecté
router.get('/', authenticateToken, requireVendeur, async (req, res) => {
  try {
    const { bien_id, statut, date_debut, date_fin } = req.query;

    let whereConditions = ['c.vendeur_id = ?'];
    let queryParams = [req.user.id];

    if (bien_id) {
      whereConditions.push('c.bien_id = ?');
      queryParams.push(bien_id);
    }
    if (statut) {
      whereConditions.push('c.statut = ?');
      queryParams.push(statut);
    }
    if (date_debut) {
      whereConditions.push('c.date_debut >= ?');
      queryParams.push(date_debut);
    }
    if (date_fin) {
      whereConditions.push('c.date_fin <= ?');
      queryParams.push(date_fin);
    }

    const whereClause = whereConditions.join(' AND ');

    const creneaux = await query(`
      SELECT 
        c.*,
        b.titre as bien_titre,
        b.adresse_complete as bien_adresse,
        ua.nom as acheteur_nom,
        ua.prenom as acheteur_prenom,
        ua.telephone as acheteur_telephone
      FROM creneaux c
      JOIN biens b ON c.bien_id = b.id
      LEFT JOIN utilisateurs ua ON c.acheteur_id = ua.id
      WHERE ${whereClause}
      ORDER BY c.date_debut ASC
    `, queryParams);

    res.json({
      creneaux: creneaux
    });

  } catch (error) {
    console.error('Erreur récupération créneaux:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des créneaux'
    });
  }
});

// GET /api/creneaux/demandes - Demandes de RDV pour le vendeur connecté
router.get('/demandes', authenticateToken, requireVendeur, async (req, res) => {
  try {
    const demandes = await query(`
      SELECT
        c.id,
        c.date_debut,
        c.date_fin,
        c.statut,
        c.date_creation,
        b.id as bien_id,
        b.titre as bien_titre,
        b.ville as bien_ville,
        b.adresse_complete as bien_adresse,
        u.id as acheteur_id,
        u.nom as acheteur_nom,
        u.prenom as acheteur_prenom,
        u.email as acheteur_email,
        u.telephone as acheteur_telephone
      FROM creneaux c
      JOIN biens b ON c.bien_id = b.id
      JOIN utilisateurs u ON c.acheteur_id = u.id
      WHERE c.vendeur_id = ? AND c.statut IN ('en_attente', 'confirme')
      ORDER BY c.date_debut ASC
    `, [req.user.id]);

    res.json({
      demandes: demandes
    });

  } catch (error) {
    console.error('Erreur récupération demandes RDV:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des demandes de RDV'
    });
  }
});

// GET /api/creneaux/mes-rdv - RDV de l'acheteur connecté
router.get('/mes-rdv', authenticateToken, requireAcheteur, async (req, res) => {
  try {
    const rdv = await query(`
      SELECT
        c.id,
        c.date_debut,
        c.date_fin,
        c.statut,
        c.date_creation,
        b.id as bien_id,
        b.titre as bien_titre,
        b.ville as bien_ville,
        b.adresse_complete as bien_adresse,
        b.prix as bien_prix,
        u.nom as vendeur_nom,
        u.prenom as vendeur_prenom,
        u.email as vendeur_email,
        u.telephone as vendeur_telephone
      FROM creneaux c
      JOIN biens b ON c.bien_id = b.id
      JOIN utilisateurs u ON c.vendeur_id = u.id
      WHERE c.acheteur_id = ? AND c.statut IN ('en_attente', 'confirme')
      ORDER BY c.date_debut ASC
    `, [req.user.id]);

    res.json({
      rdv: rdv
    });

  } catch (error) {
    console.error('Erreur récupération RDV acheteur:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des RDV'
    });
  }
});

// GET /api/creneaux/bien/:bienId - Créneaux disponibles pour un bien
router.get('/bien/:bienId', async (req, res) => {
  try {
    const bienId = req.params.bienId;

    // Vérifier que le bien existe et est publié
    const biens = await query(
      'SELECT id FROM biens WHERE id = ? AND statut_publication = ?',
      [bienId, 'publie']
    );

    if (biens.length === 0) {
      return res.status(404).json({
        error: 'Bien non trouvé',
        message: 'Le bien demandé n\'existe pas ou n\'est pas publié'
      });
    }

    // Récupérer les créneaux libres futurs
    const creneaux = await query(`
      SELECT 
        id, date_debut, date_fin, statut
      FROM creneaux
      WHERE bien_id = ? AND statut = 'libre' AND date_debut > datetime('now')
      ORDER BY date_debut ASC
    `, [bienId]);

    res.json({
      creneaux: creneaux
    });

  } catch (error) {
    console.error('Erreur récupération créneaux bien:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des créneaux'
    });
  }
});

// POST /api/creneaux - Créer un nouveau créneau (vendeur)
router.post('/', authenticateToken, requireVendeur, createCreneauValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { bien_id, date_debut, date_fin } = req.body;

    // Vérifier que le bien appartient au vendeur
    const biens = await query(
      'SELECT id FROM biens WHERE id = ? AND proprietaire_id = ?',
      [bien_id, req.user.id]
    );

    if (biens.length === 0) {
      return res.status(404).json({
        error: 'Bien non trouvé',
        message: 'Ce bien n\'existe pas ou ne vous appartient pas'
      });
    }

    // Vérifier que les dates sont cohérentes
    if (new Date(date_debut) >= new Date(date_fin)) {
      return res.status(400).json({
        error: 'Dates invalides',
        message: 'La date de fin doit être postérieure à la date de début'
      });
    }

    // Vérifier que la date de début est dans le futur
    if (new Date(date_debut) <= new Date()) {
      return res.status(400).json({
        error: 'Date invalide',
        message: 'La date de début doit être dans le futur'
      });
    }

    // Vérifier qu'il n'y a pas de conflit avec d'autres créneaux
    const conflits = await query(`
      SELECT id FROM creneaux 
      WHERE bien_id = ? AND vendeur_id = ? 
      AND statut != 'annule'
      AND (
        (date_debut <= ? AND date_fin > ?) OR
        (date_debut < ? AND date_fin >= ?) OR
        (date_debut >= ? AND date_fin <= ?)
      )
    `, [bien_id, req.user.id, date_debut, date_debut, date_fin, date_fin, date_debut, date_fin]);

    if (conflits.length > 0) {
      return res.status(409).json({
        error: 'Conflit de créneaux',
        message: 'Ce créneau entre en conflit avec un créneau existant'
      });
    }

    // Créer le créneau
    const result = await query(
      'INSERT INTO creneaux (vendeur_id, bien_id, date_debut, date_fin) VALUES (?, ?, ?, ?)',
      [req.user.id, bien_id, date_debut, date_fin]
    );

    // Récupérer le créneau créé
    const nouveauCreneau = await query(
      'SELECT * FROM creneaux WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Créneau créé avec succès',
      creneau: nouveauCreneau[0]
    });

  } catch (error) {
    console.error('Erreur création créneau:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la création du créneau'
    });
  }
});

// PUT /api/creneaux/:id - Modifier un créneau (vendeur)
router.put('/:id', authenticateToken, requireVendeur, async (req, res) => {
  try {
    const creneauId = req.params.id;
    const { date_debut, date_fin } = req.body;

    // Valider que l'ID est un nombre entier
    if (!Number.isInteger(parseInt(creneauId)) || parseInt(creneauId) <= 0) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID du créneau doit être un nombre entier positif'
      });
    }

    // Vérifier que le créneau appartient au vendeur
    const creneaux = await query(
      'SELECT * FROM creneaux WHERE id = ? AND vendeur_id = ?',
      [parseInt(creneauId), req.user.id]
    );

    if (creneaux.length === 0) {
      return res.status(404).json({
        error: 'Créneau non trouvé',
        message: 'Ce créneau n\'existe pas ou ne vous appartient pas'
      });
    }

    const creneau = creneaux[0];

    // Vérifier que le créneau n'est pas confirmé
    if (creneau.statut === 'confirme') {
      return res.status(400).json({
        error: 'Modification impossible',
        message: 'Impossible de modifier un créneau confirmé'
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (date_debut) {
      updateFields.push('date_debut = ?');
      updateValues.push(date_debut);
    }
    if (date_fin) {
      updateFields.push('date_fin = ?');
      updateValues.push(date_fin);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Aucune donnée à mettre à jour',
        message: 'Veuillez fournir au moins un champ à modifier'
      });
    }

    updateValues.push(parseInt(creneauId));

    await query(
      `UPDATE creneaux SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Récupérer le créneau mis à jour
    const creneauMisAJour = await query(
      'SELECT * FROM creneaux WHERE id = ?',
      [parseInt(creneauId)]
    );

    res.json({
      message: 'Créneau mis à jour avec succès',
      creneau: creneauMisAJour[0]
    });

  } catch (error) {
    console.error('Erreur modification créneau:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la modification du créneau'
    });
  }
});

// POST /api/rdv/demander - Demander un rendez-vous (acheteur)
router.post('/demander', authenticateToken, requireAcheteur, async (req, res) => {
  try {
    const { creneau_id } = req.body;

    if (!creneau_id) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'L\'ID du créneau est requis'
      });
    }

    // Valider que l'ID est un nombre entier
    if (!Number.isInteger(parseInt(creneau_id)) || parseInt(creneau_id) <= 0) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID du créneau doit être un nombre entier positif'
      });
    }

    // Vérifier que le créneau existe et est libre
    const creneaux = await query(
      'SELECT * FROM creneaux WHERE id = ? AND statut = ?',
      [parseInt(creneau_id), 'libre']
    );

    if (creneaux.length === 0) {
      return res.status(404).json({
        error: 'Créneau non disponible',
        message: 'Ce créneau n\'existe pas ou n\'est plus disponible'
      });
    }

    const creneau = creneaux[0];

    // Vérifier que l'acheteur ne demande pas un RDV pour son propre bien
    const biens = await query(
      'SELECT proprietaire_id FROM biens WHERE id = ?',
      [creneau.bien_id]
    );

    if (biens.length > 0 && biens[0].proprietaire_id === req.user.id) {
      return res.status(400).json({
        error: 'Action non autorisée',
        message: 'Vous ne pouvez pas prendre rendez-vous pour votre propre bien'
      });
    }

    // Mettre à jour le créneau
    await query(
      'UPDATE creneaux SET statut = ?, acheteur_id = ? WHERE id = ?',
      ['en_attente', req.user.id, parseInt(creneau_id)]
    );

    res.json({
      message: 'Demande de rendez-vous envoyée avec succès',
      creneau_id: creneau_id
    });

  } catch (error) {
    console.error('Erreur demande RDV:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la demande de rendez-vous'
    });
  }
});

// PUT /api/rdv/:id/accepter - Accepter un rendez-vous (vendeur)
router.put('/:id/accepter', authenticateToken, requireVendeur, async (req, res) => {
  try {
    const creneauId = req.params.id;

    // Vérifier que le créneau appartient au vendeur et est en attente
    const creneaux = await query(
      'SELECT * FROM creneaux WHERE id = ? AND vendeur_id = ? AND statut = ?',
      [creneauId, req.user.id, 'en_attente']
    );

    if (creneaux.length === 0) {
      return res.status(404).json({
        error: 'Créneau non trouvé',
        message: 'Ce créneau n\'existe pas, ne vous appartient pas ou n\'est pas en attente'
      });
    }

    // Confirmer le rendez-vous
    await query(
      'UPDATE creneaux SET statut = ? WHERE id = ?',
      ['confirme', creneauId]
    );

    res.json({
      message: 'Rendez-vous confirmé avec succès'
    });

  } catch (error) {
    console.error('Erreur acceptation RDV:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la confirmation du rendez-vous'
    });
  }
});

// PUT /api/rdv/:id/refuser - Refuser un rendez-vous (vendeur)
router.put('/:id/refuser', authenticateToken, requireVendeur, async (req, res) => {
  try {
    const creneauId = req.params.id;

    // Vérifier que le créneau appartient au vendeur et est en attente
    const creneaux = await query(
      'SELECT * FROM creneaux WHERE id = ? AND vendeur_id = ? AND statut = ?',
      [creneauId, req.user.id, 'en_attente']
    );

    if (creneaux.length === 0) {
      return res.status(404).json({
        error: 'Créneau non trouvé',
        message: 'Ce créneau n\'existe pas, ne vous appartient pas ou n\'est pas en attente'
      });
    }

    // Refuser le rendez-vous (remettre libre)
    await query(
      'UPDATE creneaux SET statut = ?, acheteur_id = NULL WHERE id = ?',
      ['libre', creneauId]
    );

    res.json({
      message: 'Rendez-vous refusé, le créneau est de nouveau disponible'
    });

  } catch (error) {
    console.error('Erreur refus RDV:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors du refus du rendez-vous'
    });
  }
});

// PUT /api/rdv/:id/annuler - Annuler un rendez-vous
router.put('/:id/annuler', authenticateToken, async (req, res) => {
  try {
    const creneauId = req.params.id;

    // Vérifier que l'utilisateur est concerné par ce créneau
    const creneaux = await query(
      'SELECT * FROM creneaux WHERE id = ? AND (vendeur_id = ? OR acheteur_id = ?)',
      [creneauId, req.user.id, req.user.id]
    );

    if (creneaux.length === 0) {
      return res.status(404).json({
        error: 'Créneau non trouvé',
        message: 'Ce créneau n\'existe pas ou vous n\'y avez pas accès'
      });
    }

    const creneau = creneaux[0];

    if (creneau.statut === 'libre' || creneau.statut === 'annule') {
      return res.status(400).json({
        error: 'Action impossible',
        message: 'Ce créneau n\'est pas réservé ou est déjà annulé'
      });
    }

    // Annuler le rendez-vous
    await query(
      'UPDATE creneaux SET statut = ? WHERE id = ?',
      ['annule', creneauId]
    );

    res.json({
      message: 'Rendez-vous annulé avec succès'
    });

  } catch (error) {
    console.error('Erreur annulation RDV:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de l\'annulation du rendez-vous'
    });
  }
});

// DELETE /api/creneaux/:id - Supprimer un créneau (vendeur)
router.delete('/:id', authenticateToken, requireVendeur, async (req, res) => {
  try {
    const creneauId = req.params.id;

    // Valider que l'ID est un nombre entier
    if (!Number.isInteger(parseInt(creneauId)) || parseInt(creneauId) <= 0) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID du créneau doit être un nombre entier positif'
      });
    }

    // Vérifier que le créneau appartient au vendeur
    const creneaux = await query(
      'SELECT * FROM creneaux WHERE id = ? AND vendeur_id = ?',
      [parseInt(creneauId), req.user.id]
    );

    if (creneaux.length === 0) {
      return res.status(404).json({
        error: 'Créneau non trouvé',
        message: 'Ce créneau n\'existe pas ou ne vous appartient pas'
      });
    }

    const creneau = creneaux[0];

    // Vérifier que le créneau n'est pas confirmé
    if (creneau.statut === 'confirme') {
      return res.status(400).json({
        error: 'Suppression impossible',
        message: 'Impossible de supprimer un créneau confirmé'
      });
    }

    // Supprimer le créneau
    await query('DELETE FROM creneaux WHERE id = ?', [parseInt(creneauId)]);

    res.json({
      message: 'Créneau supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression créneau:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la suppression du créneau'
    });
  }
});

module.exports = router;
