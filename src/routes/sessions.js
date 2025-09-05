const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  handleValidationErrors,
  validateObjectId,
} = require("../middleware/validation");
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getUserSessions,
  getSessionsByType,
  getSessionStats,
  addExerciseToSession,
} = require("../controllers/sessionController");

const sessionValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le nom doit contenir entre 1 et 100 caractères"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La description ne peut pas dépasser 500 caractères"),

  body("duration")
    .isInt({ min: 1 })
    .withMessage("La durée doit être d'au moins 1 minute"),

  body("type")
    .optional()
    .isIn(["strength", "cardio", "flexibility", "mixed", "custom"])
    .withMessage("Type invalide"),

  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Difficulté invalide"),

  body("exercises")
    .optional()
    .isArray()
    .withMessage("Les exercices doivent être un tableau"),

  body("exercises.*.exercise.name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(
      "Le nom de l'exercice doit contenir entre 1 et 100 caractères"
    ),

  body("exercises.*.exercise.description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "La description de l'exercice ne peut pas dépasser 500 caractères"
    ),

  body("exercises.*.sets")
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === "") {
        return true; // Allow empty values
      }
      if (typeof value === "number" && value >= 1) {
        return true; // Allow valid numbers
      }
      throw new Error("Le nombre de séries doit être d'au moins 1");
    }),

  body("exercises.*.repetitions")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Le nombre de répétitions doit être d'au moins 1"),

  body("exercises.*.weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Le poids ne peut pas être négatif"),

  body("exercises.*.duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La durée doit être d'au moins 1 seconde"),

  body("exercises.*.rest")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Le temps de repos ne peut pas être négatif"),

  body("exercises.*.order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("L'ordre doit être d'au moins 1"),

  // Validations pour les exercices combinés dans les sessions
  body("exercises.*.exercise.isCombinedExercise")
    .optional()
    .isBoolean()
    .withMessage("isCombinedExercise doit être un booléen"),

  body("exercises.*.exercise.secondaryGifUrl")
    .optional()
    .isURL()
    .withMessage("URL du deuxième GIF invalide"),

  body("exercises.*.exercise.secondaryExercise.name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(
      "Le nom du deuxième exercice doit contenir entre 1 et 100 caractères"
    ),

  body("exercises.*.exercise.secondaryExercise.description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "La description du deuxième exercice ne peut pas dépasser 500 caractères"
    ),

  body("exercises.*.exercise.secondaryExercise.category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage(
      "La catégorie du deuxième exercice ne peut pas dépasser 100 caractères"
    ),

  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic doit être un booléen"),

  body("assignedTo")
    .optional()
    .isArray()
    .withMessage("assignedTo doit être un tableau"),

  body("assignedTo.*")
    .optional()
    .isMongoId()
    .withMessage("ID d'utilisateur invalide"),

  body("tags").optional().isArray().withMessage("tags doit être un tableau"),
];

router.get("/", getAllSessions);
router.get("/stats", getSessionStats);
router.get("/type/:type", getSessionsByType);
router.get("/user/:userId", validateObjectId("userId"), getUserSessions);
router.get("/:id", validateObjectId("id"), getSessionById);

router.post(
  "/",
  authenticateToken,
  sessionValidation,
  handleValidationErrors,
  createSession
);

router.put(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  sessionValidation,
  handleValidationErrors,
  updateSession
);

router.delete("/:id", authenticateToken, validateObjectId("id"), deleteSession);

router.post(
  "/:id/exercises",
  authenticateToken,
  validateObjectId("id"),
  addExerciseToSession
);

module.exports = router;
