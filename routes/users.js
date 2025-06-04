const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database-sqlite');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation pour la mise à jour du profil
const updateProfileValidation = [
  body('nom').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('prenom').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('telephone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide')
];

// GET /api/utilisateurs/me - Profil de l'utilisateur connecté
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await query(
      'SELECT id, nom, prenom, email, role, telephone, date_creation, statut FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Votre profil n\'a pas pu être trouvé'
      });
    }

    const user = users[0];

    // Ajouter des statistiques selon le rôle
    let stats = {};
    
    if (user.role === 'vendeur') {
      // Statistiques vendeur
      const bienStats = await query(
        'SELECT COUNT(*) as total_biens, COUNT(CASE WHEN statut_publication = "publie" THEN 1 END) as biens_publies FROM biens WHERE proprietaire_id = ?',
        [user.id]
      );
      
      const conversationStats = await query(
        'SELECT COUNT(DISTINCT c.id) as total_conversations FROM conversations c JOIN biens b ON c.bien_id = b.id WHERE b.proprietaire_id = ?',
        [user.id]
      );

      stats = {
        total_biens: bienStats[0].total_biens,
        biens_publies: bienStats[0].biens_publies,
        total_conversations: conversationStats[0].total_conversations
      };
    } else if (user.role === 'acheteur') {
      // Statistiques acheteur
      const conversationStats = await query(
        'SELECT COUNT(*) as total_conversations FROM conversations WHERE acheteur_id = ?',
        [user.id]
      );
      
      const rdvStats = await query(
        'SELECT COUNT(*) as total_rdv FROM creneaux WHERE acheteur_id = ? AND statut IN ("en_attente", "confirme")',
        [user.id]
      );

      stats = {
        total_conversations: conversationStats[0].total_conversations,
        total_rdv: rdvStats[0].total_rdv
      };
    }

    res.json({
      user: user,
      stats: stats
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// PUT /api/utilisateurs/me - Mise à jour du profil
router.put('/me', authenticateToken, updateProfileValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { nom, prenom, telephone } = req.body;
    const updateFields = [];
    const updateValues = [];

    // Construire la requête de mise à jour dynamiquement
    if (nom !== undefined) {
      updateFields.push('nom = ?');
      updateValues.push(nom);
    }
    if (prenom !== undefined) {
      updateFields.push('prenom = ?');
      updateValues.push(prenom);
    }
    if (telephone !== undefined) {
      updateFields.push('telephone = ?');
      updateValues.push(telephone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Aucune donnée à mettre à jour',
        message: 'Veuillez fournir au moins un champ à modifier'
      });
    }

    updateValues.push(req.user.id);

    await query(
      `UPDATE utilisateurs SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Récupérer les données mises à jour
    const updatedUsers = await query(
      'SELECT id, nom, prenom, email, role, telephone, date_creation FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUsers[0]
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// GET /api/utilisateurs/:id - Profil public d'un utilisateur (limité)
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const users = await query(
      'SELECT id, nom, prenom, role, date_creation FROM utilisateurs WHERE id = ? AND statut = ?',
      [userId, 'actif']
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'L\'utilisateur demandé n\'existe pas'
      });
    }

    const user = users[0];

    // Informations publiques limitées
    let publicInfo = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      membre_depuis: user.date_creation
    };

    // Si c'est un vendeur, ajouter le nombre de biens
    if (user.role === 'vendeur') {
      const bienCount = await query(
        'SELECT COUNT(*) as total FROM biens WHERE proprietaire_id = ? AND statut_publication = ?',
        [user.id, 'publie']
      );
      publicInfo.total_biens = bienCount[0].total;
    }

    res.json({
      user: publicInfo
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});

module.exports = router;
