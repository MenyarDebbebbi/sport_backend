const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  handleValidationErrors,
  validateObjectId,
} = require("../middleware/validation");
const {
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  getExercisesByCategory,
  getExercisesByMuscleGroup,
  getExerciseStats,
} = require("../controllers/exerciseController");

// Validation pour les exercices
const exerciseValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le nom doit contenir entre 1 et 100 caractères"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La description ne peut pas dépasser 500 caractères"),

  body("category")
    .isIn(["strength", "cardio", "flexibility", "balance", "sports"])
    .withMessage("Catégorie invalide"),

  body("muscleGroups")
    .optional()
    .isArray()
    .withMessage("Les groupes musculaires doivent être un tableau"),

  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Difficulté invalide"),

  body("equipment")
    .optional()
    .isArray()
    .withMessage("L'équipement doit être un tableau"),

  body("instructions")
    .optional()
    .isArray()
    .withMessage("Les instructions doivent être un tableau"),

  body("tips")
    .optional()
    .isArray()
    .withMessage("Les conseils doivent être un tableau"),

  body("duration")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("La durée doit être d'au moins 1 minute"),

  body("calories")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Les calories ne peuvent pas être négatives"),
];

// Routes publiques
router.get("/", getAllExercises);
router.get("/category/:category", getExercisesByCategory);
router.get("/muscle-group/:muscleGroup", getExercisesByMuscleGroup);
router.get("/stats", getExerciseStats);
router.get("/:id", validateObjectId("id"), getExerciseById);

// Routes protégées (admin/coach seulement)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "coach"),
  exerciseValidation,
  handleValidationErrors,
  createExercise
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "coach"),
  validateObjectId("id"),
  exerciseValidation,
  handleValidationErrors,
  updateExercise
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "coach"),
  validateObjectId("id"),
  deleteExercise
);

module.exports = router;
