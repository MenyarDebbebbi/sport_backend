const { validationResult } = require("express-validator");

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      error: "Données invalides",
      message: "Veuillez corriger les erreurs suivantes",
      errors: errorMessages,
    });
  }

  next();
};

// Middleware pour valider les IDs MongoDB
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        error: "ID invalide",
        message: `L'ID ${paramName} fourni n'est pas valide`,
      });
    }

    next();
  };
};

// Middleware pour valider la pagination
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 1) {
    return res.status(400).json({
      error: "Page invalide",
      message: "Le numéro de page doit être supérieur à 0",
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      error: "Limite invalide",
      message: "La limite doit être comprise entre 1 et 100",
    });
  }

  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};

// Middleware pour valider les filtres de recherche
const validateSearchFilters = (allowedFilters) => {
  return (req, res, next) => {
    const filters = req.query;
    const invalidFilters = Object.keys(filters).filter(
      (key) =>
        !allowedFilters.includes(key) &&
        key !== "page" &&
        key !== "limit" &&
        key !== "sort" &&
        key !== "order"
    );

    if (invalidFilters.length > 0) {
      return res.status(400).json({
        error: "Filtres invalides",
        message: `Les filtres suivants ne sont pas autorisés: ${invalidFilters.join(
          ", "
        )}`,
        allowedFilters,
      });
    }

    next();
  };
};

// Middleware pour valider le tri
const validateSorting = (allowedFields) => {
  return (req, res, next) => {
    const sort = req.query.sort;
    const order = req.query.order;

    if (sort && !allowedFields.includes(sort)) {
      return res.status(400).json({
        error: "Champ de tri invalide",
        message: `Le champ de tri '${sort}' n'est pas autorisé`,
        allowedFields,
      });
    }

    if (order && !["asc", "desc", "1", "-1"].includes(order)) {
      return res.status(400).json({
        error: "Ordre de tri invalide",
        message: "L'ordre de tri doit être 'asc', 'desc', '1' ou '-1'",
      });
    }

    next();
  };
};

// Middleware pour valider les fichiers uploadés
const validateFileUpload = (allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        error: "Fichier requis",
        message: "Veuillez sélectionner un fichier à uploader",
      });
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Type de fichier non autorisé",
        message: `Seuls les types suivants sont autorisés: ${allowedTypes.join(
          ", "
        )}`,
      });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: "Fichier trop volumineux",
        message: `La taille du fichier ne peut pas dépasser ${
          maxSize / (1024 * 1024)
        } MB`,
      });
    }

    next();
  };
};

// Middleware pour valider les données de formulaire
const sanitizeInput = (req, res, next) => {
  // Nettoyer les chaînes de caractères
  Object.keys(req.body).forEach((key) => {
    if (typeof req.body[key] === "string") {
      req.body[key] = req.body[key].trim();
    }
  });

  next();
};

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  validateSearchFilters,
  validateSorting,
  validateFileUpload,
  sanitizeInput,
};
