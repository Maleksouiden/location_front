const jwt = require('jsonwebtoken');
const { query } = require('../config/database-sqlite');

// Middleware d'authentification
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'accès requis',
      message: 'Veuillez vous connecter pour accéder à cette ressource'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const user = await query(
      'SELECT id, email, role, statut FROM utilisateurs WHERE id = ? AND statut = ?',
      [decoded.userId, 'actif']
    );

    if (user.length === 0) {
      return res.status(401).json({ 
        error: 'Utilisateur non trouvé ou inactif',
        message: 'Votre compte n\'est plus valide'
      });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      ...user[0]
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        message: 'Votre session a expiré, veuillez vous reconnecter'
      });
    }
    
    return res.status(403).json({ 
      error: 'Token invalide',
      message: 'Token d\'authentification invalide'
    });
  }
};

// Middleware pour vérifier les rôles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentification requise',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: `Cette action nécessite le rôle: ${roles.join(' ou ')}`
      });
    }

    next();
  };
};

// Middleware pour vérifier que l'utilisateur est propriétaire de la ressource
const requireOwnership = (resourceIdParam = 'id', userIdField = 'proprietaire_id', tableName) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // Valider que l'ID est un nombre entier
      const parsedId = parseInt(resourceId);
      if (isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
        return res.status(400).json({
          error: 'ID invalide',
          message: 'L\'ID de la ressource doit être un nombre entier positif'
        });
      }

      // Admin peut tout faire
      if (req.user.role === 'admin') {
        return next();
      }

      // Vérifier la propriété
      const resource = await query(
        `SELECT ${userIdField} FROM ${tableName} WHERE id = ?`,
        [parsedId]
      );

      if (resource.length === 0) {
        return res.status(404).json({
          error: 'Ressource non trouvée',
          message: 'La ressource demandée n\'existe pas'
        });
      }

      if (resource[0][userIdField] !== userId) {
        return res.status(403).json({ 
          error: 'Accès refusé',
          message: 'Vous n\'êtes pas autorisé à modifier cette ressource'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur vérification propriété:', error);
      res.status(500).json({ 
        error: 'Erreur serveur',
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

// Middleware pour vérifier que l'utilisateur est vendeur
const requireVendeur = (req, res, next) => {
  if (req.user.role !== 'vendeur' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Accès refusé',
      message: 'Cette action est réservée aux vendeurs'
    });
  }
  next();
};

// Middleware pour vérifier que l'utilisateur est acheteur
const requireAcheteur = (req, res, next) => {
  if (req.user.role !== 'acheteur' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Accès refusé',
      message: 'Cette action est réservée aux acheteurs'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership,
  requireVendeur,
  requireAcheteur
};
