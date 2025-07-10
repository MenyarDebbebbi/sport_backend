const express = require("express");
const { body, query } = require("express-validator");
const router = express.Router();

const Workout = require("../models/Workout");
const Exercise = require("../models/Exercise");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  validateSearchFilters,
  validateSorting,
  sanitizeInput,
} = require("../middleware/validation");

// Validation pour la création/modification d'entraînement
const workoutValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le nom doit contenir entre 1 et 100 caractères"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La description ne peut pas dépasser 500 caractères"),

  body("type")
    .isIn([
      "strength",
      "cardio",
      "flexibility",
      "hiit",
      "circuit",
      "endurance",
      "power",
      "recovery",
      "mixed",
    ])
    .withMessage("Type d'entraînement invalide"),

  body("difficulty")
    .isIn(["beginner", "intermediate", "advanced", "expert"])
    .withMessage("Niveau de difficulté invalide"),

  body("duration")
    .isInt({ min: 5, max: 300 })
    .withMessage("La durée doit être comprise entre 5 et 300 minutes"),

  body("exercises")
    .isArray({ min: 1 })
    .withMessage("L'entraînement doit contenir au moins un exercice")
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          const exercise = value[i];
          if (!exercise.exercise) {
            throw new Error("Chaque exercice doit avoir un ID d'exercice");
          }
          if (exercise.order === undefined || exercise.order < 1) {
            throw new Error("Chaque exercice doit avoir un ordre valide");
          }
          if (exercise.sets && (exercise.sets < 1 || exercise.sets > 50)) {
            throw new Error(
              "Le nombre de séries doit être compris entre 1 et 50"
            );
          }
          if (exercise.reps && (exercise.reps < 1 || exercise.reps > 1000)) {
            throw new Error(
              "Le nombre de répétitions doit être compris entre 1 et 1000"
            );
          }
          if (
            exercise.duration &&
            (exercise.duration < 1 || exercise.duration > 3600)
          ) {
            throw new Error(
              "La durée doit être comprise entre 1 et 3600 secondes"
            );
          }
          if (
            exercise.weight &&
            (exercise.weight < 0 || exercise.weight > 1000)
          ) {
            throw new Error("Le poids doit être compris entre 0 et 1000 kg");
          }
          if (
            exercise.restTime &&
            (exercise.restTime < 0 || exercise.restTime > 600)
          ) {
            throw new Error(
              "Le temps de repos doit être compris entre 0 et 600 secondes"
            );
          }
        }
      }
      return true;
    }),

  body("targetMuscleGroups")
    .optional()
    .isArray()
    .withMessage("Les groupes musculaires cibles doivent être un tableau")
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
        throw new Error("Groupes musculaires cibles invalides");
      }
      return true;
    }),

  body("equipment")
    .optional()
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

  body("calories")
    .optional()
    .isInt({ min: 0, max: 5000 })
    .withMessage("Les calories doivent être comprises entre 0 et 5000"),

  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("Le statut public doit être un booléen"),

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

// Obtenir tous les entraînements (avec pagination et filtres)
router.get(
  "/",
  validatePagination,
  validateSearchFilters([
    "type",
    "difficulty",
    "targetMuscleGroups",
    "equipment",
    "isPublic",
    "q",
  ]),
  validateSorting([
    "name",
    "type",
    "difficulty",
    "duration",
    "rating.average",
    "completedCount",
    "createdAt",
  ]),
  async (req, res) => {
    try {
      const { page, limit, skip } = req.pagination;
      const {
        type,
        difficulty,
        targetMuscleGroups,
        equipment,
        isPublic,
        q,
        sort = "createdAt",
        order = "desc",
      } = req.query;

      let query = { isActive: true };

      // Filtres
      if (type) query.type = type;
      if (difficulty) query.difficulty = difficulty;
      if (targetMuscleGroups && targetMuscleGroups.length > 0) {
        query.targetMuscleGroups = { $in: targetMuscleGroups };
      }
      if (equipment && equipment.length > 0) {
        query.equipment = { $in: equipment };
      }
      if (isPublic !== undefined) query.isPublic = isPublic === "true";

      // Recherche textuelle
      if (q) {
        query.$text = { $search: q };
      }

      // Tri
      const sortOrder = order === "desc" || order === "-1" ? -1 : 1;
      const sortObject = {};
      sortObject[sort] = sortOrder;

      const workouts = await Workout.find(query)
        .populate("createdBy", "username firstName lastName")
        .populate("exercises.exercise", "name description category difficulty")
        .sort(sortObject)
        .skip(skip)
        .limit(limit);

      const total = await Workout.countDocuments(query);

      res.json({
        workouts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des entraînements:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la récupération des entraînements",
      });
    }
  }
);

// Obtenir un entraînement par ID
router.get("/:id", validateObjectId("id"), async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id)
      .populate("createdBy", "username firstName lastName")
      .populate(
        "exercises.exercise",
        "name description category difficulty muscleGroups equipment instructions tips videoUrl imageUrl"
      );

    if (!workout) {
      return res.status(404).json({
        error: "Entraînement non trouvé",
        message: "L'entraînement demandé n'existe pas",
      });
    }

    // Vérifier si l'entraînement est public ou si l'utilisateur est le créateur
    if (
      !workout.isPublic &&
      req.user &&
      workout.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        error: "Accès refusé",
        message: "Cet entraînement est privé",
      });
    }

    res.json({ workout });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entraînement:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération de l'entraînement",
    });
  }
});

// Créer un nouvel entraînement
router.post(
  "/",
  authenticateToken,
  authorizeRoles("user", "trainer", "admin"),
  sanitizeInput,
  workoutValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Vérifier que tous les exercices existent
      const exerciseIds = req.body.exercises.map((ex) => ex.exercise);
      const exercises = await Exercise.find({
        _id: { $in: exerciseIds },
        isActive: true,
      });

      if (exercises.length !== exerciseIds.length) {
        return res.status(400).json({
          error: "Exercices invalides",
          message: "Certains exercices n'existent pas ou ne sont pas actifs",
        });
      }

      const workout = new Workout({
        ...req.body,
        createdBy: req.user._id,
      });

      await workout.save();

      const populatedWorkout = await Workout.findById(workout._id)
        .populate("createdBy", "username firstName lastName")
        .populate("exercises.exercise", "name description category difficulty");

      res.status(201).json({
        message: "Entraînement créé avec succès",
        workout: populatedWorkout,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'entraînement:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la création de l'entraînement",
      });
    }
  }
);

// Mettre à jour un entraînement
router.put(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  sanitizeInput,
  workoutValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const workout = await Workout.findById(req.params.id);

      if (!workout) {
        return res.status(404).json({
          error: "Entraînement non trouvé",
          message: "L'entraînement demandé n'existe pas",
        });
      }

      // Vérifier les permissions
      if (
        req.user.role !== "admin" &&
        workout.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'êtes pas autorisé à modifier cet entraînement",
        });
      }

      // Vérifier que tous les exercices existent si des exercices sont fournis
      if (req.body.exercises) {
        const exerciseIds = req.body.exercises.map((ex) => ex.exercise);
        const exercises = await Exercise.find({
          _id: { $in: exerciseIds },
          isActive: true,
        });

        if (exercises.length !== exerciseIds.length) {
          return res.status(400).json({
            error: "Exercices invalides",
            message: "Certains exercices n'existent pas ou ne sont pas actifs",
          });
        }
      }

      const updatedWorkout = await Workout.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate("createdBy", "username firstName lastName")
        .populate("exercises.exercise", "name description category difficulty");

      res.json({
        message: "Entraînement mis à jour avec succès",
        workout: updatedWorkout,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'entraînement:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la mise à jour de l'entraînement",
      });
    }
  }
);

// Supprimer un entraînement
router.delete(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const workout = await Workout.findById(req.params.id);

      if (!workout) {
        return res.status(404).json({
          error: "Entraînement non trouvé",
          message: "L'entraînement demandé n'existe pas",
        });
      }

      // Vérifier les permissions
      if (
        req.user.role !== "admin" &&
        workout.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'êtes pas autorisé à supprimer cet entraînement",
        });
      }

      await Workout.findByIdAndDelete(req.params.id);

      res.json({
        message: "Entraînement supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'entraînement:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la suppression de l'entraînement",
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
      const workout = await Workout.findById(req.params.id);

      if (!workout) {
        return res.status(404).json({
          error: "Entraînement non trouvé",
          message: "L'entraînement demandé n'existe pas",
        });
      }

      await workout.toggleFavorite(req.user._id);

      res.json({
        message: workout.isFavorite(req.user._id)
          ? "Entraînement ajouté aux favoris"
          : "Entraînement retiré des favoris",
        isFavorite: workout.isFavorite(req.user._id),
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

// Marquer un entraînement comme terminé
router.post(
  "/:id/complete",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const workout = await Workout.findById(req.params.id);

      if (!workout) {
        return res.status(404).json({
          error: "Entraînement non trouvé",
          message: "L'entraînement demandé n'existe pas",
        });
      }

      await workout.markCompleted();

      res.json({
        message: "Entraînement marqué comme terminé",
        completedCount: workout.completedCount,
      });
    } catch (error) {
      console.error("Erreur lors de la marque comme terminé:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message: "Une erreur s'est produite lors de la marque comme terminé",
      });
    }
  }
);

// Obtenir les entraînements populaires
router.get("/popular/list", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const workouts = await Workout.getPopular(limit);

    res.json({ workouts });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des entraînements populaires:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des entraînements populaires",
    });
  }
});

// Obtenir les entraînements de l'utilisateur connecté
router.get(
  "/user/my-workouts",
  authenticateToken,
  validatePagination,
  async (req, res) => {
    try {
      const { page, limit, skip } = req.pagination;
      const { sort = "createdAt", order = "desc" } = req.query;

      const sortOrder = order === "desc" || order === "-1" ? -1 : 1;
      const sortObject = {};
      sortObject[sort] = sortOrder;

      const workouts = await Workout.find({
        createdBy: req.user._id,
        isActive: true,
      })
        .populate("exercises.exercise", "name description category difficulty")
        .sort(sortObject)
        .skip(skip)
        .limit(limit);

      const total = await Workout.countDocuments({
        createdBy: req.user._id,
        isActive: true,
      });

      res.json({
        workouts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des entraînements:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message:
          "Une erreur s'est produite lors de la récupération des entraînements",
      });
    }
  }
);

module.exports = router;
