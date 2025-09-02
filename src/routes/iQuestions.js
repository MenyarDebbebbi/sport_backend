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

// Middleware pour nettoyer les données avant validation
const sanitizeHealthData = (req, res, next) => {
  // Convertir les valeurs null, undefined, et chaînes vides en undefined pour les champs numériques
  const numericFields = [
    "restingHeartRate",
    "cardioTest",
    "pushupsPerMinute",
    "situpsPerMinute",
    "stretching",
    "bodyFatPercentage",
    "bodyWeight",
  ];

  numericFields.forEach((field) => {
    if (
      req.body[field] === null ||
      req.body[field] === "" ||
      req.body[field] === 0
    ) {
      delete req.body[field];
    }
  });

  // Gérer la pression artérielle
  if (req.body.bloodPressure) {
    if (
      req.body.bloodPressure.systolic === null ||
      req.body.bloodPressure.systolic === "" ||
      req.body.bloodPressure.systolic === 0
    ) {
      delete req.body.bloodPressure.systolic;
    }
    if (
      req.body.bloodPressure.diastolic === null ||
      req.body.bloodPressure.diastolic === "" ||
      req.body.bloodPressure.diastolic === 0
    ) {
      delete req.body.bloodPressure.diastolic;
    }
    // Si les deux champs sont supprimés, supprimer l'objet entier
    if (!req.body.bloodPressure.systolic && !req.body.bloodPressure.diastolic) {
      delete req.body.bloodPressure;
    }
  }

  // Convertir les chaînes vides en undefined pour les champs de chaîne
  const stringFields = [
    "heartProblems",
    "chestPainDuringExercise",
    "chestPainLastMonth",
    "dizzinessOrFainting",
    "jointProblems",
    "bloodPressureOrHeartMedication",
    "type1Diabetes",
    "otherExerciseRestrictions",
    "hasAllergies",
    "allergiesDetails",
  ];

  stringFields.forEach((field) => {
    if (req.body[field] === null || req.body[field] === "") {
      delete req.body[field];
    }
  });

  next();
};

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
  sanitizeHealthData,
  questionValidation,
  handleValidationErrors,
  createOrUpdateQuestions
);
router.put(
  "/my-questions",
  authenticateToken,
  sanitizeHealthData,
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
