const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');

// Validation pour l'inscription
const registerValidation = [
	body('username')
		.optional()
		.trim()
		.isLength({ min: 3, max: 30 })
		.withMessage("Le nom d'utilisateur doit contenir entre 3 et 30 caractères")
		.matches(/^[a-zA-Z0-9_]+$/)
		.withMessage("Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores"),

	body('email').isEmail().normalizeEmail().withMessage('Veuillez fournir un email valide'),

	body('password')
		.isLength({ min: 6 })
		.withMessage('Le mot de passe doit contenir au moins 6 caractères')
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage(
			'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
		),

	body('firstName')
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage('Le prénom doit contenir entre 1 et 50 caractères'),

	body('lastName')
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage('Le nom de famille doit contenir entre 1 et 50 caractères'),

	body('dateOfBirth')
		.optional()
		.isISO8601()
		.withMessage('Veuillez fournir une date de naissance valide')
		.custom((value) => {
			const birthDate = new Date(value);
			const today = new Date();
			const age = today.getFullYear() - birthDate.getFullYear();
			if (age < 13 || age > 120) {
				throw new Error("L'âge doit être compris entre 13 et 120 ans");
			}
			return true;
		}),

	body('gender')
		.optional()
		.isIn(['male', 'female', 'other'])
		.withMessage('Le genre doit être male, female ou other'),

	body('height')
		.optional()
		.isFloat({ min: 50, max: 300 })
		.withMessage('La taille doit être comprise entre 50 et 300 cm'),

	body('weight')
		.optional()
		.isFloat({ min: 20, max: 500 })
		.withMessage('Le poids doit être compris entre 20 et 500 kg'),

	body('fitnessLevel')
		.optional()
		.isIn(['beginner', 'intermediate', 'advanced', 'expert'])
		.withMessage('Le niveau de forme doit être beginner, intermediate, advanced ou expert'),

	body('goals')
		.optional()
		.isArray()
		.withMessage('Les objectifs doivent être un tableau')
		.custom((value) => {
			const validGoals = [
				'weight_loss',
				'muscle_gain',
				'endurance',
				'flexibility',
				'strength',
				'general_fitness',
			];
			if (value && !value.every((goal) => validGoals.includes(goal))) {
				throw new Error('Objectifs invalides');
			}
			return true;
		}),
];

// Validation pour la connexion
const loginValidation = [
	body('email').isEmail().normalizeEmail().withMessage('Veuillez fournir un email valide'),

	body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

// Validation pour le changement de mot de passe
const changePasswordValidation = [
	body('currentPassword').notEmpty().withMessage("L'ancien mot de passe est requis"),

	body('newPassword')
		.isLength({ min: 6 })
		.withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage(
			'Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
		),
];

// Routes
router.post(
	'/register',
	sanitizeInput,
	registerValidation,
	handleValidationErrors,
	authController.register,
);
router.post('/login', sanitizeInput, loginValidation, handleValidationErrors, authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, sanitizeInput, authController.updateProfile);
router.put(
	'/change-password',
	authenticateToken,
	sanitizeInput,
	changePasswordValidation,
	handleValidationErrors,
	authController.changePassword,
);
router.post('/logout', authenticateToken, authController.logout);
router.post('/refresh-token', authenticateToken, authController.refreshToken);

module.exports = router;
