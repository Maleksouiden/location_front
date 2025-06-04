const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database-sqlite');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation pour l'inscription
const registerValidation = [
  body('nom').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('prenom').trim().isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('mot_de_passe').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role').isIn(['acheteur', 'vendeur']).withMessage('Le rôle doit être "acheteur" ou "vendeur"'),
  body('telephone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide')
];

// Validation pour la connexion
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('mot_de_passe').notEmpty().withMessage('Mot de passe requis')
];

// POST /api/auth/register - Inscription
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { nom, prenom, email, mot_de_passe, role, telephone } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await query(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: 'Email déjà utilisé',
        message: 'Un compte avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

    // Créer l'utilisateur
    const result = await query(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, role, telephone) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom, prenom, email, hashedPassword, role, telephone]
    );

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: result.insertId, 
        email: email, 
        role: role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      token: token,
      user: {
        id: result.insertId,
        nom,
        prenom,
        email,
        role,
        telephone
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la création du compte'
    });
  }
});

// POST /api/auth/login - Connexion
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, mot_de_passe } = req.body;

    // Rechercher l'utilisateur
    const users = await query(
      'SELECT id, nom, prenom, email, mot_de_passe_hash, role, telephone, statut FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];

    // Vérifier le statut du compte
    if (user.statut !== 'actif') {
      return res.status(401).json({
        error: 'Compte inactif',
        message: 'Votre compte a été désactivé'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token: token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        telephone: user.telephone
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la connexion'
    });
  }
});

// POST /api/auth/verify - Vérifier le token
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    // Récupérer les informations complètes de l'utilisateur
    const users = await query(
      'SELECT id, nom, prenom, email, role, telephone FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        valid: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    res.json({
      valid: true,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        telephone: user.telephone
      }
    });
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({
      valid: false,
      message: 'Erreur lors de la vérification'
    });
  }
});

// POST /api/auth/logout - Déconnexion (côté client principalement)
router.post('/logout', (req, res) => {
  res.json({
    message: 'Déconnexion réussie'
  });
});

module.exports = router;
