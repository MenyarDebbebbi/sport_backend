const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Token d'accès requis",
        message: "Veuillez vous connecter pour accéder à cette ressource",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier si l'utilisateur existe toujours
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        error: "Token invalide",
        message: "Utilisateur non trouvé",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: "Compte désactivé",
        message: "Votre compte a été désactivé",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token invalide",
        message: "Le token fourni n'est pas valide",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expiré",
        message: "Votre session a expiré, veuillez vous reconnecter",
      });
    }

    console.error("Erreur d'authentification:", error);
    res.status(500).json({
      error: "Erreur d'authentification",
      message: "Une erreur s'est produite lors de la vérification du token",
    });
  }
};

// Middleware pour vérifier les rôles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Non autorisé",
        message: "Vous devez être connecté pour accéder à cette ressource",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Accès refusé",
        message:
          "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource",
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur est propriétaire de la ressource
const authorizeOwner = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Non autorisé",
        message: "Vous devez être connecté pour accéder à cette ressource",
      });
    }

    // Les admins peuvent accéder à tout
    if (req.user.role === "admin") {
      return next();
    }

    // Vérifier si l'utilisateur est propriétaire de la ressource
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        error: "Accès refusé",
        message: "Vous n'êtes pas autorisé à accéder à cette ressource",
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur est connecté (optionnel)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // En cas d'erreur, on continue sans authentification
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeOwner,
  optionalAuth,
};
