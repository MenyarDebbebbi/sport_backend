const express = require("express");
const { body, query } = require("express-validator");
const router = express.Router();

const User = require("../models/User");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  validateSearchFilters,
  validateSorting,
  sanitizeInput,
} = require("../middleware/validation");

// Validation pour la mise à jour d'utilisateur
const updateUserValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Le prénom doit contenir entre 1 et 50 caractères"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Le nom de famille doit contenir entre 1 et 50 caractères"),

  body("height")
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage("La taille doit être comprise entre 50 et 300 cm"),

  body("weight")
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage("Le poids doit être compris entre 20 et 500 kg"),

  body("fitnessLevel")
    .optional()
    .isIn(["beginner", "intermediate", "advanced", "expert"])
    .withMessage(
      "Le niveau de forme doit être beginner, intermediate, advanced ou expert"
    ),

  body("goals")
    .optional()
    .isArray()
    .withMessage("Les objectifs doivent être un tableau")
    .custom((value) => {
      const validGoals = [
        "weight_loss",
        "muscle_gain",
        "endurance",
        "flexibility",
        "strength",
        "general_fitness",
      ];
      if (value && !value.every((goal) => validGoals.includes(goal))) {
        throw new Error("Objectifs invalides");
      }
      return true;
    }),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Le statut actif doit être un booléen"),

  body("role")
    .optional()
    .isIn(["user", "trainer", "admin"])
    .withMessage("Le rôle doit être user, trainer ou admin"),
];

// Obtenir tous les utilisateurs (admin seulement)
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  validatePagination,
  validateSearchFilters(["role", "fitnessLevel", "isActive"]),
  validateSorting([
    "username",
    "firstName",
    "lastName",
    "email",
    "createdAt",
    "lastLogin",
  ]),
  async (req, res) => {
    try {
      const { page, limit, skip } = req.pagination;
      const {
        role,
        fitnessLevel,
        isActive,
        sort = "createdAt",
        order = "desc",
      } = req.query;

      let query = {};

      // Filtres
      if (role) query.role = role;
      if (fitnessLevel) query.fitnessLevel = fitnessLevel;
      if (isActive !== undefined) query.isActive = isActive === "true";

      // Tri
      const sortOrder = order === "desc" || order === "-1" ? -1 : 1;
      const sortObject = {};
      sortObject[sort] = sortOrder;

      const users = await User.find(query)
        .select("-password")
        .sort(sortObject)
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la récupération des utilisateurs",
      });
    }
  }
);

// Obtenir un utilisateur par ID
router.get(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");

      if (!user) {
        return res.status(404).json({
          error: "Utilisateur non trouvé",
          message: "L'utilisateur demandé n'existe pas",
        });
      }

      // Vérifier les permissions
      if (
        req.user.role !== "admin" &&
        req.user._id.toString() !== req.params.id
      ) {
        return res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'êtes pas autorisé à accéder à ce profil",
        });
      }

      res.json({ user });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la récupération de l'utilisateur",
      });
    }
  }
);

// Mettre à jour un utilisateur
router.put(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  sanitizeInput,
  updateUserValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          error: "Utilisateur non trouvé",
          message: "L'utilisateur demandé n'existe pas",
        });
      }

      // Vérifier les permissions
      if (
        req.user.role !== "admin" &&
        req.user._id.toString() !== req.params.id
      ) {
        return res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'êtes pas autorisé à modifier ce profil",
        });
      }

      // Seuls les admins peuvent changer le rôle et le statut actif
      if (req.user.role !== "admin") {
        delete req.body.role;
        delete req.body.isActive;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).select("-password");

      res.json({
        message: "Utilisateur mis à jour avec succès",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la mise à jour de l'utilisateur",
      });
    }
  }
);

// Supprimer un utilisateur (admin seulement)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  validateObjectId("id"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          error: "Utilisateur non trouvé",
          message: "L'utilisateur demandé n'existe pas",
        });
      }

      // Empêcher la suppression de son propre compte
      if (req.user._id.toString() === req.params.id) {
        return res.status(400).json({
          error: "Action non autorisée",
          message: "Vous ne pouvez pas supprimer votre propre compte",
        });
      }

      await User.findByIdAndDelete(req.params.id);

      res.json({
        message: "Utilisateur supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la suppression de l'utilisateur",
      });
    }
  }
);

// Désactiver/activer un utilisateur (admin seulement)
router.patch(
  "/:id/toggle-status",
  authenticateToken,
  authorizeRoles("admin"),
  validateObjectId("id"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          error: "Utilisateur non trouvé",
          message: "L'utilisateur demandé n'existe pas",
        });
      }

      // Empêcher la désactivation de son propre compte
      if (req.user._id.toString() === req.params.id) {
        return res.status(400).json({
          error: "Action non autorisée",
          message: "Vous ne pouvez pas désactiver votre propre compte",
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.json({
        message: `Utilisateur ${
          user.isActive ? "activé" : "désactivé"
        } avec succès`,
        user: user.toPublicJSON(),
      });
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message: "Une erreur s'est produite lors du changement de statut",
      });
    }
  }
);

// Obtenir les statistiques des utilisateurs (admin seulement)
router.get(
  "/stats/overview",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = await User.countDocuments({ isActive: false });

      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]);

      const usersByFitnessLevel = await User.aggregate([
        {
          $group: {
            _id: "$fitnessLevel",
            count: { $sum: 1 },
          },
        },
      ]);

      const recentUsers = await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 derniers jours
      });

      res.json({
        stats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          recent: recentUsers,
          byRole: usersByRole,
          byFitnessLevel: usersByFitnessLevel,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la récupération des statistiques",
      });
    }
  }
);

// Rechercher des utilisateurs (admin seulement)
router.get(
  "/search/users",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          error: "Requête invalide",
          message:
            "La requête de recherche doit contenir au moins 2 caractères",
        });
      }

      const users = await User.find({
        $or: [
          { username: { $regex: q, $options: "i" } },
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      })
        .select("-password")
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      res.json({ users });
    } catch (error) {
      console.error("Erreur lors de la recherche d'utilisateurs:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la recherche d'utilisateurs",
      });
    }
  }
);

module.exports = router;
