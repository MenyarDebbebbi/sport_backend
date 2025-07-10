const express = require("express");
const { body, query } = require("express-validator");
const router = express.Router();

const Exercise = require("../models/Exercise");
const {
  authenticateToken,
  authorizeRoles,
  authorizeOwner,
} = require("../middleware/auth");
const {
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  validateSearchFilters,
  validateSorting,
  sanitizeInput,
} = require("../middleware/validation");

// Validation pour la création/modification d'exercice
const exerciseValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le nom doit contenir entre 1 et 100 caractères"),

  body("description")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("La description doit contenir entre 1 et 1000 caractères"),

  body("category")
    .isIn([
      "strength",
      "cardio",
      "flexibility",
      "balance",
      "sports",
      "yoga",
      "pilates",
      "hiit",
      "calisthenics",
      "other",
    ])
    .withMessage("Catégorie invalide"),

  body("muscleGroups")
    .isArray()
    .withMessage("Les groupes musculaires doivent être un tableau")
    .custom((value) => {
      const validMuscleGroups = [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "forearms",
        "abs",
        "obliques",
        "lower_back",
        "glutes",
        "quadriceps",
        "hamstrings",
        "calves",
        "full_body",
        "core",
      ];
      if (value && !value.every((group) => validMuscleGroups.includes(group))) {
        throw new Error("Groupes musculaires invalides");
      }
      return true;
    }),

  body("difficulty")
    .isIn(["beginner", "intermediate", "advanced", "expert"])
    .withMessage("Niveau de difficulté invalide"),

  body("equipment")
    .isArray()
    .withMessage("L'équipement doit être un tableau")
    .custom((value) => {
      const validEquipment = [
        "none",
        "dumbbells",
        "barbell",
        "kettlebell",
        "resistance_band",
        "pull_up_bar",
        "bench",
        "mat",
        "treadmill",
        "bicycle",
        "elliptical",
        "rower",
        "cable_machine",
        "smith_machine",
        "other",
      ];
      if (value && !value.every((item) => validEquipment.includes(item))) {
        throw new Error("Équipement invalide");
      }
      return true;
    }),

  body("instructions")
    .isArray()
    .withMessage("Les instructions doivent être un tableau")
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          const instruction = value[i];
          if (!instruction.step || !instruction.description) {
            throw new Error(
              "Chaque instruction doit avoir un numéro d'étape et une description"
            );
          }
          if (instruction.description.length > 500) {
            throw new Error(
              "Chaque description d'instruction ne peut pas dépasser 500 caractères"
            );
          }
        }
      }
      return true;
    }),

  body("tips")
    .optional()
    .isArray()
    .withMessage("Les conseils doivent être un tableau")
    .custom((value) => {
      if (value && value.some((tip) => tip.length > 300)) {
        throw new Error("Chaque conseil ne peut pas dépasser 300 caractères");
      }
      return true;
    }),

  body("videoUrl")
    .optional()
    .isURL()
    .withMessage("L'URL de la vidéo doit être valide"),

  body("imageUrl")
    .optional()
    .isURL()
    .withMessage("L'URL de l'image doit être valide"),

  body("duration")
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage("La durée doit être comprise entre 1 et 300 minutes"),

  body("caloriesPerMinute")
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage(
      "Les calories par minute doivent être comprises entre 0 et 50"
    ),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Les tags doivent être un tableau")
    .custom((value) => {
      if (value && value.some((tag) => tag.length > 30)) {
        throw new Error("Chaque tag ne peut pas dépasser 30 caractères");
      }
      return true;
    }),
];

// Validation pour la recherche
const searchValidation = [
  query("q")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("La requête de recherche ne peut pas être vide"),

  query("category")
    .optional()
    .isIn([
      "strength",
      "cardio",
      "flexibility",
      "balance",
      "sports",
      "yoga",
      "pilates",
      "hiit",
      "calisthenics",
      "other",
    ])
    .withMessage("Catégorie invalide"),

  query("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced", "expert"])
    .withMessage("Niveau de difficulté invalide"),

  query("muscleGroups")
    .optional()
    .isArray()
    .withMessage("Les groupes musculaires doivent être un tableau"),

  query("equipment")
    .optional()
    .isArray()
    .withMessage("L'équipement doit être un tableau"),
];

// Obtenir tous les exercices (avec pagination et filtres)
router.get(
  "/",
  validatePagination,
  validateSearchFilters([
    "category",
    "difficulty",
    "muscleGroups",
    "equipment",
    "q",
  ]),
  validateSorting([
    "name",
    "category",
    "difficulty",
    "rating.average",
    "createdAt",
  ]),
  searchValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { page, limit, skip } = req.pagination;
      const {
        q,
        category,
        difficulty,
        muscleGroups,
        equipment,
        sort = "name",
        order = "asc",
      } = req.query;

      let query = { isActive: true };

      // Filtres
      if (category) query.category = category;
      if (difficulty) query.difficulty = difficulty;
      if (muscleGroups && muscleGroups.length > 0) {
        query.muscleGroups = { $in: muscleGroups };
      }
      if (equipment && equipment.length > 0) {
        query.equipment = { $in: equipment };
      }

      // Recherche textuelle
      if (q) {
        query.$text = { $search: q };
      }

      // Tri
      const sortOrder = order === "desc" || order === "-1" ? -1 : 1;
      const sortObject = {};
      sortObject[sort] = sortOrder;

      const exercises = await Exercise.find(query)
        .populate("createdBy", "username firstName lastName")
        .sort(sortObject)
        .skip(skip)
        .limit(limit);

      const total = await Exercise.countDocuments(query);

      res.json({
        exercises,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des exercices:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la récupération des exercices",
      });
    }
  }
);

// Obtenir un exercice par ID
router.get("/:id", validateObjectId("id"), async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate(
      "createdBy",
      "username firstName lastName"
    );

    if (!exercise) {
      return res.status(404).json({
        error: "Exercice non trouvé",
        message: "L'exercice demandé n'existe pas",
      });
    }

    res.json({ exercise });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'exercice:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération de l'exercice",
    });
  }
});

// Créer un nouvel exercice
router.post(
  "/",
  authenticateToken,
  authorizeRoles("user", "trainer", "admin"),
  sanitizeInput,
  exerciseValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const exercise = new Exercise({
        ...req.body,
        createdBy: req.user._id,
      });

      await exercise.save();

      res.status(201).json({
        message: "Exercice créé avec succès",
        exercise,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'exercice:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message: "Une erreur s'est produite lors de la création de l'exercice",
      });
    }
  }
);

// Mettre à jour un exercice
router.put(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  sanitizeInput,
  exerciseValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const exercise = await Exercise.findById(req.params.id);

      if (!exercise) {
        return res.status(404).json({
          error: "Exercice non trouvé",
          message: "L'exercice demandé n'existe pas",
        });
      }

      // Vérifier les permissions
      if (
        req.user.role !== "admin" &&
        exercise.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'êtes pas autorisé à modifier cet exercice",
        });
      }

      const updatedExercise = await Exercise.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate("createdBy", "username firstName lastName");

      res.json({
        message: "Exercice mis à jour avec succès",
        exercise: updatedExercise,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'exercice:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la mise à jour de l'exercice",
      });
    }
  }
);

// Supprimer un exercice
router.delete(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const exercise = await Exercise.findById(req.params.id);

      if (!exercise) {
        return res.status(404).json({
          error: "Exercice non trouvé",
          message: "L'exercice demandé n'existe pas",
        });
      }

      // Vérifier les permissions
      if (
        req.user.role !== "admin" &&
        exercise.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'êtes pas autorisé à supprimer cet exercice",
        });
      }

      await Exercise.findByIdAndDelete(req.params.id);

      res.json({
        message: "Exercice supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'exercice:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la suppression de l'exercice",
      });
    }
  }
);

// Ajouter/retirer des favoris
router.post(
  "/:id/favorite",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const exercise = await Exercise.findById(req.params.id);

      if (!exercise) {
        return res.status(404).json({
          error: "Exercice non trouvé",
          message: "L'exercice demandé n'existe pas",
        });
      }

      await exercise.toggleFavorite(req.user._id);

      res.json({
        message: exercise.isFavorite(req.user._id)
          ? "Exercice ajouté aux favoris"
          : "Exercice retiré des favoris",
        isFavorite: exercise.isFavorite(req.user._id),
      });
    } catch (error) {
      console.error("Erreur lors de la gestion des favoris:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message: "Une erreur s'est produite lors de la gestion des favoris",
      });
    }
  }
);

// Obtenir les exercices populaires
router.get("/popular/list", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const exercises = await Exercise.getPopular(limit);

    res.json({ exercises });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des exercices populaires:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des exercices populaires",
    });
  }
});

module.exports = router;
