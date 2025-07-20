const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  handleValidationErrors,
  validateObjectId,
} = require("../middleware/validation");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getCoaches,
} = require("../controllers/userController");

// Validation pour la création/mise à jour d'utilisateur
const userValidation = [
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

  body("email").optional().isEmail().withMessage("Email invalide"),

  body("phone")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Le téléphone doit contenir entre 1 et 20 caractères"),

  body("city")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("La ville doit contenir entre 1 et 100 caractères"),

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
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage(
      "Le niveau de forme doit être beginner, intermediate ou advanced"
    ),

  body("goals")
    .optional()
    .isArray()
    .withMessage("Les objectifs doivent être un tableau"),

  body("role")
    .optional()
    .isIn(["user", "coach", "admin"])
    .withMessage("Le rôle doit être user, coach ou admin"),

  body("status")
    .optional()
    .isIn(["active", "pending", "inactive"])
    .withMessage("Le statut doit être active, pending ou inactive"),
];

// Routes publiques
router.get("/coaches", getCoaches);

// Routes protégées
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "coach"),
  getAllUsers
);
router.get("/stats", authenticateToken, authorizeRoles("admin"), getUserStats);
router.get("/:id", authenticateToken, validateObjectId("id"), getUserById);

// Routes admin/coach seulement
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "coach"),
  userValidation,
  handleValidationErrors,
  createUser
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "coach"),
  validateObjectId("id"),
  userValidation,
  handleValidationErrors,
  updateUser
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  validateObjectId("id"),
  deleteUser
);

module.exports = router;
