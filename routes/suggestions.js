const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database-sqlite');
const { authenticateToken, requireAcheteur } = require('../middleware/auth');

const router = express.Router();

// Validation pour les préférences
const preferencesValidation = [
  body('statut_recherche').isIn(['location', 'achat']).withMessage('Statut de recherche invalide'),
  body('budget_min').optional().isFloat({ min: 0 }).withMessage('Budget minimum invalide'),
  body('budget_max').optional().isFloat({ min: 0 }).withMessage('Budget maximum invalide'),
  body('type_bien_prefere').optional().isIn(['maison', 'immeuble', 'villa', 'appartement', 'terrain']).withMessage('Type de bien invalide'),
  body('surface_min').optional().isFloat({ min: 0 }).withMessage('Surface minimum invalide'),
  body('nombre_pieces_min').optional().isInt({ min: 1 }).withMessage('Nombre de pièces minimum invalide'),
  body('ville_preferee').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Ville préférée invalide')
];

// POST /api/preferences - Enregistrer/Mettre à jour les préférences
router.post('/', authenticateToken, requireAcheteur, preferencesValidation, async (req, res) => {
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
      statut_recherche,
      budget_min,
      budget_max,
      type_bien_prefere,
      surface_min,
      nombre_pieces_min,
      ville_preferee
    } = req.body;

    // Vérifier la cohérence des budgets
    if (budget_min && budget_max && budget_min > budget_max) {
      return res.status(400).json({
        error: 'Budgets incohérents',
        message: 'Le budget minimum ne peut pas être supérieur au budget maximum'
      });
    }

    // Vérifier si des préférences existent déjà
    const existingPrefs = await query(
      'SELECT id FROM preferences_acheteur WHERE acheteur_id = ?',
      [req.user.id]
    );

    if (existingPrefs.length > 0) {
      // Mettre à jour les préférences existantes
      await query(`
        UPDATE preferences_acheteur SET
          statut_recherche = ?,
          budget_min = ?,
          budget_max = ?,
          type_bien_prefere = ?,
          surface_min = ?,
          nombre_pieces_min = ?,
          ville_preferee = ?,
          date_mise_a_jour = CURRENT_TIMESTAMP
        WHERE acheteur_id = ?
      `, [
        statut_recherche,
        budget_min || null,
        budget_max || null,
        type_bien_prefere || null,
        surface_min || null,
        nombre_pieces_min || null,
        ville_preferee || null,
        req.user.id
      ]);
    } else {
      // Créer de nouvelles préférences
      await query(`
        INSERT INTO preferences_acheteur (
          acheteur_id, statut_recherche, budget_min, budget_max,
          type_bien_prefere, surface_min, nombre_pieces_min, ville_preferee
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        req.user.id,
        statut_recherche,
        budget_min || null,
        budget_max || null,
        type_bien_prefere || null,
        surface_min || null,
        nombre_pieces_min || null,
        ville_preferee || null
      ]);
    }

    // Récupérer les préférences mises à jour
    const preferences = await query(
      'SELECT * FROM preferences_acheteur WHERE acheteur_id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Préférences enregistrées avec succès',
      preferences: preferences[0]
    });

  } catch (error) {
    console.error('Erreur enregistrement préférences:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de l\'enregistrement des préférences'
    });
  }
});

// GET /api/preferences - Récupérer les préférences de l'acheteur
router.get('/', authenticateToken, requireAcheteur, async (req, res) => {
  try {
    const preferences = await query(
      'SELECT * FROM preferences_acheteur WHERE acheteur_id = ?',
      [req.user.id]
    );

    if (preferences.length === 0) {
      return res.json({
        preferences: null,
        message: 'Aucune préférence définie'
      });
    }

    res.json({
      preferences: preferences[0]
    });

  } catch (error) {
    console.error('Erreur récupération préférences:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des préférences'
    });
  }
});

// Fonction pour calculer le score de correspondance
function calculateMatchScore(bien, preferences) {
  let score = 0;
  let maxScore = 0;

  // Correspondance du statut (location/vente) - Poids: 30
  maxScore += 30;
  if (bien.statut === preferences.statut_recherche) {
    score += 30;
  }

  // Correspondance du type de bien - Poids: 20
  if (preferences.type_bien_prefere) {
    maxScore += 20;
    if (bien.type_bien === preferences.type_bien_prefere) {
      score += 20;
    }
  }

  // Correspondance du budget - Poids: 25
  if (preferences.budget_min || preferences.budget_max) {
    maxScore += 25;
    let budgetMatch = true;
    
    if (preferences.budget_min && bien.prix < preferences.budget_min) {
      budgetMatch = false;
    }
    if (preferences.budget_max && bien.prix > preferences.budget_max) {
      budgetMatch = false;
    }
    
    if (budgetMatch) {
      score += 25;
    }
  }

  // Correspondance de la surface - Poids: 15
  if (preferences.surface_min) {
    maxScore += 15;
    if (bien.surface >= preferences.surface_min) {
      score += 15;
    }
  }

  // Correspondance du nombre de pièces - Poids: 10
  if (preferences.nombre_pieces_min) {
    maxScore += 10;
    if (bien.nombre_pieces >= preferences.nombre_pieces_min) {
      score += 10;
    }
  }

  // Correspondance de la ville - Poids: 20
  if (preferences.ville_preferee) {
    maxScore += 20;
    if (bien.ville.toLowerCase().includes(preferences.ville_preferee.toLowerCase())) {
      score += 20;
    }
  }

  // Calculer le pourcentage final
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// GET /api/suggestions - Obtenir des suggestions personnalisées
router.get('/', authenticateToken, requireAcheteur, async (req, res) => {
  try {
    // Récupérer les préférences de l'acheteur
    const preferences = await query(
      'SELECT * FROM preferences_acheteur WHERE acheteur_id = ?',
      [req.user.id]
    );

    if (preferences.length === 0) {
      return res.status(400).json({
        error: 'Préférences manquantes',
        message: 'Veuillez d\'abord définir vos préférences de recherche'
      });
    }

    const userPrefs = preferences[0];

    // Construire la requête de base pour récupérer les biens
    let whereConditions = ['b.statut_publication = ?'];
    let queryParams = ['publie'];

    // Filtrer par statut de recherche
    whereConditions.push('b.statut = ?');
    queryParams.push(userPrefs.statut_recherche);

    // Filtres optionnels basés sur les préférences
    if (userPrefs.budget_min) {
      whereConditions.push('b.prix >= ?');
      queryParams.push(userPrefs.budget_min);
    }
    if (userPrefs.budget_max) {
      whereConditions.push('b.prix <= ?');
      queryParams.push(userPrefs.budget_max);
    }
    if (userPrefs.surface_min) {
      whereConditions.push('b.surface >= ?');
      queryParams.push(userPrefs.surface_min);
    }
    if (userPrefs.nombre_pieces_min) {
      whereConditions.push('b.nombre_pieces >= ?');
      queryParams.push(userPrefs.nombre_pieces_min);
    }

    const whereClause = whereConditions.join(' AND ');

    // Récupérer les biens correspondants
    const biens = await query(`
      SELECT 
        b.*,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        (SELECT url_image FROM photos_biens WHERE bien_id = b.id AND est_principale = 1 LIMIT 1) as photo_principale
      FROM biens b
      JOIN utilisateurs u ON b.proprietaire_id = u.id
      WHERE ${whereClause}
      ORDER BY b.date_publication DESC
      LIMIT 50
    `, queryParams);

    // Calculer les scores et trier
    const suggestions = biens.map(bien => {
      const score = calculateMatchScore(bien, userPrefs);
      return {
        ...bien,
        score_correspondance: score
      };
    }).filter(bien => bien.score_correspondance > 0)
      .sort((a, b) => b.score_correspondance - a.score_correspondance)
      .slice(0, 20); // Limiter à 20 suggestions

    // Sauvegarder les suggestions en base pour tracking
    for (const suggestion of suggestions) {
      await query(`
        INSERT OR REPLACE INTO suggestions (acheteur_id, bien_id, score)
        VALUES (?, ?, ?)
      `, [req.user.id, suggestion.id, suggestion.score_correspondance]);
    }

    res.json({
      suggestions: suggestions,
      preferences_utilisees: userPrefs,
      total_suggestions: suggestions.length
    });

  } catch (error) {
    console.error('Erreur génération suggestions:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la génération des suggestions'
    });
  }
});

// PUT /api/suggestions/:bienId/vue - Marquer une suggestion comme vue
router.put('/:bienId/vue', authenticateToken, requireAcheteur, async (req, res) => {
  try {
    const bienId = req.params.bienId;

    // Valider que l'ID est un nombre entier
    if (!Number.isInteger(parseInt(bienId)) || parseInt(bienId) <= 0) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID du bien doit être un nombre entier positif'
      });
    }

    await query(
      'UPDATE suggestions SET vue = 1 WHERE acheteur_id = ? AND bien_id = ?',
      [req.user.id, parseInt(bienId)]
    );

    res.json({
      message: 'Suggestion marquée comme vue'
    });

  } catch (error) {
    console.error('Erreur marquage vue suggestion:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors du marquage de la suggestion'
    });
  }
});

// GET /api/suggestions/historique - Historique des suggestions
router.get('/historique', authenticateToken, requireAcheteur, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const suggestions = await query(`
      SELECT 
        s.*,
        b.titre,
        b.ville,
        b.prix,
        b.type_bien,
        (SELECT url_image FROM photos_biens WHERE bien_id = b.id AND est_principale = 1 LIMIT 1) as photo_principale
      FROM suggestions s
      JOIN biens b ON s.bien_id = b.id
      WHERE s.acheteur_id = ?
      ORDER BY s.date_suggestion DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), offset]);

    // Compter le total
    const totalResult = await query(
      'SELECT COUNT(*) as total FROM suggestions WHERE acheteur_id = ?',
      [req.user.id]
    );

    res.json({
      suggestions: suggestions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erreur historique suggestions:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

module.exports = router;
