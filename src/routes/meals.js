const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  handleValidationErrors,
  validateObjectId,
} = require("../middleware/validation");
const {
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  reviewMeal,
  getUserMeals,
  getMealsByType,
  getMealStats,
} = require("../controllers/mealController");

// Validation pour les repas
const mealValidation = [
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
    .isIn(["breakfast", "lunch", "dinner", "snack"])
    .withMessage("Type de repas invalide"),

  body("items")
    .optional()
    .isArray()
    .withMessage("Les aliments doivent être un tableau"),

  body("items.*.name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le nom de l'aliment doit contenir entre 1 et 100 caractères"),

  body("items.*.quantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("La quantité ne peut pas être négative"),

  body("items.*.unit")
    .optional()
    .isIn(["g", "kg", "ml", "l", "piece", "cup", "tablespoon", "teaspoon"])
    .withMessage("Unité invalide"),

  body("items.*.calories")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Les calories ne peuvent pas être négatives"),

  body("items.*.protein")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Les protéines ne peuvent pas être négatives"),

  body("items.*.carbs")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Les glucides ne peuvent pas être négatifs"),

  body("items.*.fat")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Les lipides ne peuvent pas être négatifs"),

  body("items.*.fiber")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Les fibres ne peuvent pas être négatives"),

  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("ID d'utilisateur invalide"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Les tags doivent être un tableau"),
];

// Validation pour la révision de repas
const reviewValidation = [
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Le statut doit être 'approved' ou 'rejected'"),

  body("reviewNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Les notes de révision ne peuvent pas dépasser 500 caractères"
    ),
];

// Routes publiques
router.get("/", getAllMeals);
router.get("/type/:type", getMealsByType);
router.get("/stats", getMealStats);
router.get("/:id", validateObjectId("id"), getMealById);

// Routes protégées
router.get("/user/:userId?", authenticateToken, getUserMeals);

// Routes utilisateur
router.post(
  "/",
  authenticateToken,
  mealValidation,
  handleValidationErrors,
  createMeal
);
router.put(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  mealValidation,
  handleValidationErrors,
  updateMeal
);
router.delete("/:id", authenticateToken, validateObjectId("id"), deleteMeal);

// Routes admin/coach seulement
router.patch(
  "/:id/review",
  authenticateToken,
  authorizeRoles("admin", "coach"),
  validateObjectId("id"),
  reviewValidation,
  handleValidationErrors,
  reviewMeal
);

module.exports = router;
