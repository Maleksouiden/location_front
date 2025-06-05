const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database-sqlite');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/appointments - Récupérer les rendez-vous de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let appointments;

    if (userRole === 'vendeur') {
      // Pour les vendeurs : récupérer les demandes de RDV pour leurs biens
      appointments = await query(`
        SELECT 
          a.*,
          b.titre as bien_titre,
          b.adresse_complete as bien_adresse,
          u.nom as demandeur_nom,
          u.prenom as demandeur_prenom,
          u.email as demandeur_email,
          u.telephone as demandeur_telephone
        FROM appointments a
        JOIN biens b ON a.bien_id = b.id
        JOIN utilisateurs u ON a.demandeur_id = u.id
        WHERE b.proprietaire_id = ?
        ORDER BY a.date_rdv ASC
      `, [userId]);
    } else {
      // Pour les acheteurs : récupérer leurs demandes de RDV
      appointments = await query(`
        SELECT 
          a.*,
          b.titre as bien_titre,
          b.adresse_complete as bien_adresse,
          u.nom as proprietaire_nom,
          u.prenom as proprietaire_prenom,
          u.email as proprietaire_email,
          u.telephone as proprietaire_telephone
        FROM appointments a
        JOIN biens b ON a.bien_id = b.id
        JOIN utilisateurs u ON b.proprietaire_id = u.id
        WHERE a.demandeur_id = ?
        ORDER BY a.date_rdv ASC
      `, [userId]);
    }

    res.json({
      success: true,
      appointments: appointments
    });

  } catch (error) {
    console.error('Erreur récupération rendez-vous:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des rendez-vous'
    });
  }
});

// POST /api/appointments - Créer une demande de rendez-vous
router.post('/',
  authenticateToken,
  [
    body('bien_id').isInt({ min: 1 }).withMessage('ID du bien requis'),
    body('date_rdv').isISO8601().withMessage('Date de rendez-vous requise'),
    body('heure_rdv').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure de rendez-vous requise (format HH:MM)'),
    body('message').optional().isLength({ max: 500 }).withMessage('Message trop long (max 500 caractères)')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { bien_id, date_rdv, heure_rdv, message } = req.body;
      const demandeur_id = req.user.id;

      // Vérifier que le bien existe
      const biens = await query('SELECT * FROM biens WHERE id = ?', [bien_id]);
      if (biens.length === 0) {
        return res.status(404).json({
          error: 'Bien non trouvé',
          message: 'Le bien demandé n\'existe pas'
        });
      }

      const bien = biens[0];

      // Vérifier que l'utilisateur n'est pas le propriétaire
      if (bien.proprietaire_id === demandeur_id) {
        return res.status(400).json({
          error: 'Action non autorisée',
          message: 'Vous ne pouvez pas demander un rendez-vous pour votre propre bien'
        });
      }

      // Vérifier qu'il n'y a pas déjà une demande en attente pour ce bien et cet utilisateur
      const existingAppointments = await query(`
        SELECT * FROM appointments 
        WHERE bien_id = ? AND demandeur_id = ? AND statut = 'en_attente'
      `, [bien_id, demandeur_id]);

      if (existingAppointments.length > 0) {
        return res.status(400).json({
          error: 'Demande existante',
          message: 'Vous avez déjà une demande de rendez-vous en attente pour ce bien'
        });
      }

      // Créer la demande de rendez-vous
      const result = await query(`
        INSERT INTO appointments (
          bien_id, demandeur_id, date_rdv, heure_rdv, message, statut, date_creation
        ) VALUES (?, ?, ?, ?, ?, 'en_attente', datetime('now'))
      `, [bien_id, demandeur_id, date_rdv, heure_rdv, message || null]);

      res.status(201).json({
        success: true,
        message: 'Demande de rendez-vous créée avec succès',
        appointment_id: result.insertId
      });

    } catch (error) {
      console.error('Erreur création rendez-vous:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création du rendez-vous'
      });
    }
  }
);

// PUT /api/appointments/:id/status - Accepter ou refuser un rendez-vous (vendeur uniquement)
router.put('/:id/status',
  authenticateToken,
  [
    body('statut').isIn(['accepte', 'refuse']).withMessage('Statut invalide'),
    body('message_reponse').optional().isLength({ max: 500 }).withMessage('Message de réponse trop long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const appointmentId = req.params.id;
      const { statut, message_reponse } = req.body;
      const userId = req.user.id;

      // Récupérer le rendez-vous et vérifier que l'utilisateur est le propriétaire
      const appointments = await query(`
        SELECT a.*, b.proprietaire_id 
        FROM appointments a
        JOIN biens b ON a.bien_id = b.id
        WHERE a.id = ?
      `, [appointmentId]);

      if (appointments.length === 0) {
        return res.status(404).json({
          error: 'Rendez-vous non trouvé',
          message: 'Le rendez-vous demandé n\'existe pas'
        });
      }

      const appointment = appointments[0];

      if (appointment.proprietaire_id !== userId) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Vous n\'êtes pas autorisé à modifier ce rendez-vous'
        });
      }

      if (appointment.statut !== 'en_attente') {
        return res.status(400).json({
          error: 'Action impossible',
          message: 'Ce rendez-vous a déjà été traité'
        });
      }

      // Mettre à jour le statut
      await query(`
        UPDATE appointments 
        SET statut = ?, message_reponse = ?, date_reponse = datetime('now')
        WHERE id = ?
      `, [statut, message_reponse || null, appointmentId]);

      res.json({
        success: true,
        message: `Rendez-vous ${statut === 'accepte' ? 'accepté' : 'refusé'} avec succès`
      });

    } catch (error) {
      console.error('Erreur mise à jour rendez-vous:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la mise à jour du rendez-vous'
      });
    }
  }
);

// DELETE /api/appointments/:id - Annuler un rendez-vous
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;

    // Récupérer le rendez-vous
    const appointments = await query(`
      SELECT a.*, b.proprietaire_id 
      FROM appointments a
      JOIN biens b ON a.bien_id = b.id
      WHERE a.id = ?
    `, [appointmentId]);

    if (appointments.length === 0) {
      return res.status(404).json({
        error: 'Rendez-vous non trouvé',
        message: 'Le rendez-vous demandé n\'existe pas'
      });
    }

    const appointment = appointments[0];

    // Vérifier que l'utilisateur est soit le demandeur soit le propriétaire
    if (appointment.demandeur_id !== userId && appointment.proprietaire_id !== userId) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous n\'êtes pas autorisé à annuler ce rendez-vous'
      });
    }

    // Supprimer le rendez-vous
    await query('DELETE FROM appointments WHERE id = ?', [appointmentId]);

    res.json({
      success: true,
      message: 'Rendez-vous annulé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression rendez-vous:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de l\'annulation du rendez-vous'
    });
  }
});

module.exports = router;
