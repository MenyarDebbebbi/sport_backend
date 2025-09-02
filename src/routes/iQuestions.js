const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  handleValidationErrors,
  validateObjectId,
} = require("../middleware/validation");
const {
  getUserQuestions,
  createOrUpdateQuestions,
  getAllQuestions,
  getQuestionsStats,
  deleteUserQuestions,
  getUserRecommendations,
} = require("../controllers/iQuestionController");

// Validation pour les questions de santé
const questionValidation = [
  // Pression artérielle
  body("bloodPressure.systolic")
    .optional()
    .isFloat({ min: 70, max: 200 })
    .withMessage(
      "La pression systolique doit être comprise entre 70 et 200 mmHg"
    ),

  body("bloodPressure.diastolic")
    .optional()
    .isFloat({ min: 40, max: 130 })
    .withMessage(
      "La pression diastolique doit être comprise entre 40 et 130 mmHg"
    ),

  // Fréquence cardiaque
  body("restingHeartRate")
    .optional()
    .isFloat({ min: 40, max: 120 })
    .withMessage(
      "La fréquence cardiaque doit être comprise entre 40 et 120 bpm"
    ),

  // Tests de fitness
  body("cardioTest")
    .optional()
    .isFloat({ min: 1, max: 60 })
    .withMessage("Le test cardio doit être compris entre 1 et 60 minutes"),

  body("pushupsPerMinute")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(
      "Le nombre de pompes doit être compris entre 0 et 100 par minute"
    ),

  body("situpsPerMinute")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(
      "Le nombre d'abdominaux doit être compris entre 0 et 100 par minute"
    ),

  body("stretching")
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage("L'étirement doit être compris entre 0 et 50 cm"),

  // Composition corporelle
  body("bodyFatPercentage")
    .optional()
    .isFloat({ min: 5, max: 50 })
    .withMessage(
      "Le pourcentage de graisse corporelle doit être compris entre 5% et 50%"
    ),

  body("bodyWeight")
    .optional()
    .isFloat({ min: 30, max: 200 })
    .withMessage("Le poids doit être compris entre 30 et 200 kg"),

  // Questions médicales
  body("heartProblems")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("La réponse doit être yes ou no"),

  body("chestPainDuringExercise")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("La réponse doit être yes ou no"),

  body("chestPainLastMonth")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("La réponse doit être yes ou no"),

  body("dizzinessOrFainting")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("La réponse doit être yes ou no"),

  body("jointProblems")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("La réponse doit être yes ou no"),

  body("bloodPressureOrHeartMedication")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("La réponse doit être yes ou no"),

  body("type1Diabetes")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("La réponse doit être yes ou no"),

  body("otherExerciseRestrictions")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("La réponse doit être yes ou no"),

  // Allergies
  body("hasAllergies")
    .optional()
    .isIn(["yes", "no"])
    .withMessage("La réponse doit être yes ou no"),

  body("allergiesDetails")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Les détails des allergies ne peuvent pas dépasser 1000 caractères"
    ),
];

// Routes pour les utilisateurs (leurs propres questions)
router.get("/my-questions", authenticateToken, getUserQuestions);
router.post(
  "/my-questions",
  authenticateToken,
  questionValidation,
  handleValidationErrors,
  createOrUpdateQuestions
);
router.put(
  "/my-questions",
  authenticateToken,
  questionValidation,
  handleValidationErrors,
  createOrUpdateQuestions
);
router.get("/my-recommendations", authenticateToken, getUserRecommendations);

// Routes pour les coachs et admins (toutes les questions)
router.get("/", authenticateToken, authorizeRoles("coach"), getAllQuestions);
router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("coach"),
  getQuestionsStats
);

// Routes pour les questions d'un utilisateur spécifique (coachs/admins)
router.get(
  "/user/:userId",
  authenticateToken,
  authorizeRoles("coach"),
  validateObjectId("userId"),
  getUserQuestions
);
router.post(
  "/user/:userId",
  authenticateToken,
  authorizeRoles("coach"),
  validateObjectId("userId"),
  questionValidation,
  handleValidationErrors,
  createOrUpdateQuestions
);
router.put(
  "/user/:userId",
  authenticateToken,
  authorizeRoles("coach"),
  validateObjectId("userId"),
  questionValidation,
  handleValidationErrors,
  createOrUpdateQuestions
);
router.get(
  "/user/:userId/recommendations",
  authenticateToken,
  authorizeRoles("coach"),
  validateObjectId("userId"),
  getUserRecommendations
);

// Route pour supprimer les questions (admins seulement)
router.delete(
  "/user/:userId",
  authenticateToken,
  authorizeRoles("admin"),
  validateObjectId("userId"),
  deleteUserQuestions
);

module.exports = router;
