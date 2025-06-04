const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database-sqlite');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation pour créer une conversation
const createConversationValidation = [
  body('bien_id').isInt({ min: 1 }).withMessage('ID du bien invalide'),
  body('contenu_initial').trim().isLength({ min: 1, max: 1000 }).withMessage('Le message initial doit contenir entre 1 et 1000 caractères')
];

// Validation pour créer une conversation directe
const createDirectConversationValidation = [
  body('destinataire_id').isInt({ min: 1 }).withMessage('ID du destinataire invalide'),
  body('contenu_initial').trim().isLength({ min: 1, max: 1000 }).withMessage('Le message initial doit contenir entre 1 et 1000 caractères')
];

// Validation pour envoyer un message
const sendMessageValidation = [
  body('contenu').trim().isLength({ min: 1, max: 1000 }).withMessage('Le message doit contenir entre 1 et 1000 caractères')
];

// GET /api/conversations - Liste des conversations de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    let conversations;

    if (req.user.role === 'acheteur') {
      // Conversations où l'utilisateur est acheteur
      conversations = await query(`
        SELECT
          c.*,
          b.titre as bien_titre,
          b.ville as bien_ville,
          b.prix as bien_prix,
          u.nom as vendeur_nom,
          u.prenom as vendeur_prenom,
          (SELECT contenu FROM messages WHERE conversation_id = c.id ORDER BY date_envoi DESC LIMIT 1) as dernier_message,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND expediteur_id != ? AND lu = 0) as messages_non_lus
        FROM conversations c
        LEFT JOIN biens b ON c.bien_id = b.id
        JOIN utilisateurs u ON c.vendeur_id = u.id
        WHERE c.acheteur_id = ?
        ORDER BY c.date_derniere_message DESC
      `, [req.user.id, req.user.id]);
    } else if (req.user.role === 'vendeur') {
      // Conversations où l'utilisateur est vendeur
      conversations = await query(`
        SELECT
          c.*,
          b.titre as bien_titre,
          b.ville as bien_ville,
          b.prix as bien_prix,
          u.nom as acheteur_nom,
          u.prenom as acheteur_prenom,
          (SELECT contenu FROM messages WHERE conversation_id = c.id ORDER BY date_envoi DESC LIMIT 1) as dernier_message,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND expediteur_id != ? AND lu = 0) as messages_non_lus
        FROM conversations c
        LEFT JOIN biens b ON c.bien_id = b.id
        JOIN utilisateurs u ON c.acheteur_id = u.id
        WHERE c.vendeur_id = ?
        ORDER BY c.date_derniere_message DESC
      `, [req.user.id, req.user.id]);
    } else {
      // Admin peut voir toutes les conversations
      conversations = await query(`
        SELECT
          c.*,
          b.titre as bien_titre,
          b.ville as bien_ville,
          b.prix as bien_prix,
          ua.nom as acheteur_nom,
          ua.prenom as acheteur_prenom,
          uv.nom as vendeur_nom,
          uv.prenom as vendeur_prenom,
          (SELECT contenu FROM messages WHERE conversation_id = c.id ORDER BY date_envoi DESC LIMIT 1) as dernier_message
        FROM conversations c
        LEFT JOIN biens b ON c.bien_id = b.id
        JOIN utilisateurs ua ON c.acheteur_id = ua.id
        JOIN utilisateurs uv ON c.vendeur_id = uv.id
        ORDER BY c.date_derniere_message DESC
      `);
    }

    // Structurer les données des conversations
    const structuredConversations = conversations.map(conv => ({
      id: conv.id,
      acheteur_id: conv.acheteur_id,
      vendeur_id: conv.vendeur_id,
      bien_id: conv.bien_id,
      date_creation: conv.date_creation,
      date_derniere_message: conv.date_derniere_message,
      dernier_message: conv.dernier_message,
      messages_non_lus: conv.messages_non_lus || 0,
      acheteur: conv.acheteur_nom ? {
        nom: conv.acheteur_nom,
        prenom: conv.acheteur_prenom
      } : null,
      vendeur: conv.vendeur_nom ? {
        nom: conv.vendeur_nom,
        prenom: conv.vendeur_prenom
      } : null,
      bien: conv.bien_titre ? {
        titre: conv.bien_titre,
        ville: conv.bien_ville,
        prix: conv.bien_prix
      } : null
    }));

    res.json({
      conversations: structuredConversations
    });

  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des conversations'
    });
  }
});

// GET /api/conversations/:id/messages - Messages d'une conversation
router.get('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;

    // Valider que l'ID est un nombre entier
    if (!Number.isInteger(parseInt(conversationId)) || parseInt(conversationId) <= 0) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID de la conversation doit être un nombre entier positif'
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation et récupérer les infos complètes
    const conversations = await query(`
      SELECT
        c.*,
        ua.nom as acheteur_nom,
        ua.prenom as acheteur_prenom,
        ua.email as acheteur_email,
        uv.nom as vendeur_nom,
        uv.prenom as vendeur_prenom,
        uv.email as vendeur_email,
        b.titre as bien_titre,
        b.ville as bien_ville,
        b.prix as bien_prix
      FROM conversations c
      JOIN utilisateurs ua ON c.acheteur_id = ua.id
      JOIN utilisateurs uv ON c.vendeur_id = uv.id
      LEFT JOIN biens b ON c.bien_id = b.id
      WHERE c.id = ? AND (c.acheteur_id = ? OR c.vendeur_id = ? OR ? = 'admin')
    `, [parseInt(conversationId), req.user.id, req.user.id, req.user.role]);

    if (conversations.length === 0) {
      return res.status(404).json({
        error: 'Conversation non trouvée',
        message: 'Cette conversation n\'existe pas ou vous n\'y avez pas accès'
      });
    }

    // Récupérer les messages
    const messages = await query(`
      SELECT
        m.*,
        u.nom as expediteur_nom,
        u.prenom as expediteur_prenom
      FROM messages m
      JOIN utilisateurs u ON m.expediteur_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.date_envoi ASC
    `, [parseInt(conversationId)]);

    // Marquer les messages comme lus pour l'utilisateur connecté
    await query(`
      UPDATE messages
      SET lu = 1
      WHERE conversation_id = ? AND expediteur_id != ?
    `, [parseInt(conversationId), req.user.id]);

    // Structurer les données de conversation
    const conversationData = conversations[0];
    const structuredConversation = {
      id: conversationData.id,
      acheteur_id: conversationData.acheteur_id,
      vendeur_id: conversationData.vendeur_id,
      bien_id: conversationData.bien_id,
      date_creation: conversationData.date_creation,
      date_derniere_message: conversationData.date_derniere_message,
      acheteur: {
        nom: conversationData.acheteur_nom,
        prenom: conversationData.acheteur_prenom,
        email: conversationData.acheteur_email
      },
      vendeur: {
        nom: conversationData.vendeur_nom,
        prenom: conversationData.vendeur_prenom,
        email: conversationData.vendeur_email
      },
      bien: conversationData.bien_id ? {
        titre: conversationData.bien_titre,
        ville: conversationData.bien_ville,
        prix: conversationData.bien_prix
      } : null
    };

    res.json({
      conversation: structuredConversation,
      messages: messages
    });

  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la récupération des messages'
    });
  }
});

// POST /api/conversations - Créer une nouvelle conversation
router.post('/', authenticateToken, createConversationValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { bien_id, contenu_initial } = req.body;

    // Vérifier que le bien existe et récupérer le vendeur
    const biens = await query(
      'SELECT proprietaire_id FROM biens WHERE id = ? AND statut_publication = ?',
      [bien_id, 'publie']
    );

    if (biens.length === 0) {
      return res.status(404).json({
        error: 'Bien non trouvé',
        message: 'Le bien demandé n\'existe pas ou n\'est pas publié'
      });
    }

    const vendeur_id = biens[0].proprietaire_id;

    // Vérifier que l'utilisateur ne contacte pas son propre bien
    if (vendeur_id === req.user.id) {
      return res.status(400).json({
        error: 'Action non autorisée',
        message: 'Vous ne pouvez pas contacter votre propre annonce'
      });
    }

    // Déterminer les rôles corrects selon le rôle de l'utilisateur connecté
    let acheteur_id, final_vendeur_id;

    if (req.user.role === 'acheteur') {
      // L'utilisateur connecté est un acheteur
      acheteur_id = req.user.id;
      final_vendeur_id = vendeur_id;
    } else {
      // L'utilisateur connecté est un vendeur qui contacte un autre vendeur
      // Dans ce cas, on inverse les rôles pour cette conversation spécifique
      acheteur_id = req.user.id;
      final_vendeur_id = vendeur_id;
    }

    // Vérifier si une conversation existe déjà (dans les deux sens)
    const existingConversations = await query(`
      SELECT id FROM conversations
      WHERE bien_id = ? AND (
        (acheteur_id = ? AND vendeur_id = ?) OR
        (acheteur_id = ? AND vendeur_id = ?)
      )
    `, [bien_id, req.user.id, vendeur_id, vendeur_id, req.user.id]);

    let conversationId;

    if (existingConversations.length > 0) {
      // Conversation existe déjà
      conversationId = existingConversations[0].id;
    } else {
      // Créer une nouvelle conversation
      const conversationResult = await query(
        'INSERT INTO conversations (acheteur_id, vendeur_id, bien_id) VALUES (?, ?, ?)',
        [acheteur_id, final_vendeur_id, bien_id]
      );
      conversationId = conversationResult.insertId;
    }

    // Ajouter le message initial
    await query(
      'INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [conversationId, req.user.id, contenu_initial]
    );

    // Mettre à jour la date du dernier message
    await query(
      'UPDATE conversations SET date_derniere_message = CURRENT_TIMESTAMP WHERE id = ?',
      [conversationId]
    );

    res.status(201).json({
      message: 'Conversation créée avec succès',
      conversation_id: conversationId
    });

  } catch (error) {
    console.error('Erreur création conversation:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la création de la conversation'
    });
  }
});

// POST /api/conversations/:id/messages - Envoyer un message
router.post('/:id/messages', authenticateToken, sendMessageValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const conversationId = req.params.id;
    const { contenu } = req.body;

    // Valider que l'ID est un nombre entier
    if (!Number.isInteger(parseInt(conversationId)) || parseInt(conversationId) <= 0) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID de la conversation doit être un nombre entier positif'
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversations = await query(`
      SELECT * FROM conversations
      WHERE id = ? AND (acheteur_id = ? OR vendeur_id = ?)
    `, [parseInt(conversationId), req.user.id, req.user.id]);

    if (conversations.length === 0) {
      return res.status(404).json({
        error: 'Conversation non trouvée',
        message: 'Cette conversation n\'existe pas ou vous n\'y avez pas accès'
      });
    }

    // Ajouter le message
    const messageResult = await query(
      'INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [parseInt(conversationId), req.user.id, contenu]
    );

    // Mettre à jour la date du dernier message
    await query(
      'UPDATE conversations SET date_derniere_message = CURRENT_TIMESTAMP WHERE id = ?',
      [parseInt(conversationId)]
    );

    // Récupérer le message créé avec les infos de l'expéditeur
    const nouveauMessage = await query(`
      SELECT 
        m.*,
        u.nom as expediteur_nom,
        u.prenom as expediteur_prenom
      FROM messages m
      JOIN utilisateurs u ON m.expediteur_id = u.id
      WHERE m.id = ?
    `, [messageResult.insertId]);

    res.status(201).json({
      message: 'Message envoyé avec succès',
      nouveau_message: nouveauMessage[0]
    });

  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de l\'envoi du message'
    });
  }
});

// POST /api/conversations/direct - Créer une conversation directe entre utilisateurs
router.post('/direct', authenticateToken, createDirectConversationValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { destinataire_id, contenu_initial } = req.body;

    // Vérifier que l'utilisateur ne s'envoie pas un message à lui-même
    if (destinataire_id === req.user.id) {
      return res.status(400).json({
        error: 'Action non autorisée',
        message: 'Vous ne pouvez pas vous envoyer un message à vous-même'
      });
    }

    // Vérifier que le destinataire existe
    const destinataires = await query(
      'SELECT id FROM utilisateurs WHERE id = ?',
      [destinataire_id]
    );

    if (destinataires.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Le destinataire demandé n\'existe pas'
      });
    }

    // Vérifier si une conversation directe existe déjà entre ces deux utilisateurs
    const existingConversations = await query(`
      SELECT id FROM conversations
      WHERE bien_id IS NULL
      AND ((acheteur_id = ? AND vendeur_id = ?) OR (acheteur_id = ? AND vendeur_id = ?))
    `, [req.user.id, destinataire_id, destinataire_id, req.user.id]);

    let conversationId;

    if (existingConversations.length > 0) {
      // Conversation existe déjà
      conversationId = existingConversations[0].id;
    } else {
      // Créer une nouvelle conversation directe (sans bien_id)
      const conversationResult = await query(
        'INSERT INTO conversations (acheteur_id, vendeur_id, bien_id) VALUES (?, ?, NULL)',
        [req.user.id, destinataire_id]
      );
      conversationId = conversationResult.insertId;
    }

    // Ajouter le message initial
    await query(
      'INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [conversationId, req.user.id, contenu_initial]
    );

    // Mettre à jour la date du dernier message
    await query(
      'UPDATE conversations SET date_derniere_message = CURRENT_TIMESTAMP WHERE id = ?',
      [conversationId]
    );

    res.status(201).json({
      message: 'Conversation directe créée avec succès',
      conversation_id: conversationId
    });

  } catch (error) {
    console.error('Erreur création conversation directe:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la création de la conversation directe'
    });
  }
});

module.exports = router;
