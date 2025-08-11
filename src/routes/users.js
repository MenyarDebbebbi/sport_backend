const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleValidationErrors, validateObjectId } = require('../middleware/validation');
const {
	getAllUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
	getUserStats,
	getCoaches,
} = require('../controllers/userController');

// Validation pour la création/mise à jour d'utilisateur
const userValidation = [
	body('firstName')
		.optional()
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage('Le prénom doit contenir entre 1 et 50 caractères'),

	body('lastName')
		.optional()
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage('Le nom de famille doit contenir entre 1 et 50 caractères'),

	body('email').optional().isEmail().withMessage('Email invalide'),

	body('phone')
		.optional()
		.trim()
		.isLength({ min: 1, max: 20 })
		.withMessage('Le téléphone doit contenir entre 1 et 20 caractères'),

	body('city')
		.optional()
		.trim()
		.isLength({ min: 1, max: 100 })
		.withMessage('La ville doit contenir entre 1 et 100 caractères'),

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
		.isIn(['beginner', 'intermediate', 'advanced'])
		.withMessage('Le niveau de forme doit être beginner, intermediate ou advanced'),

	body('goals').optional().isArray().withMessage('Les objectifs doivent être un tableau'),

	body('role')
		.optional()
		.isIn(['user', 'coach', 'admin'])
		.withMessage('Le rôle doit être user, coach ou admin'),

	body('status')
		.optional()
		.isIn(['active', 'pending', 'inactive'])
		.withMessage('Le statut doit être active, pending ou inactive'),
];

// Routes publiques
router.get('/coaches', getCoaches);

// Route de test pour créer un utilisateur admin (à supprimer en production)
router.post('/test-admin', async (req, res) => {
	try {
		const User = require('../models/User');

		// Vérifier si l'admin existe déjà
		const existingAdmin = await User.findOne({ email: 'admin@test.com' });
		if (existingAdmin) {
			return res.json({
				message: 'Admin de test existe déjà',
				user: existingAdmin.toPublicJSON(),
			});
		}

		// Créer un admin de test
		const adminUser = new User({
			username: 'admin.test',
			email: 'admin@test.com',
			password: 'password123',
			firstName: 'Admin',
			lastName: 'Test',
			role: 'admin',
			status: 'active',
			isActive: true,
			isVerified: true,
		});

		await adminUser.save();

		res.status(201).json({
			message: 'Admin de test créé avec succès',
			user: adminUser.toPublicJSON(),
		});
	} catch (error) {
		console.error("Erreur lors de la création de l'admin de test:", error);
		res.status(500).json({
			error: 'Erreur serveur',
			message: "Une erreur s'est produite lors de la création de l'admin de test",
		});
	}
});

// Routes protégées
router.get('/', authenticateToken, authorizeRoles('coach'), getAllUsers);
router.get('/stats', authenticateToken, authorizeRoles('coach'), getUserStats);
router.get('/:id', authenticateToken, authorizeRoles('coach'), validateObjectId('id'), getUserById);

// Routes admin/coach seulement
router.post(
	'/',
	authenticateToken,
	authorizeRoles('coach'),
	userValidation,
	handleValidationErrors,
	createUser,
);
router.put(
	'/:id',
	authenticateToken,
	authorizeRoles('coach'),
	validateObjectId('id'),
	userValidation,
	handleValidationErrors,
	updateUser,
);
router.delete(
	'/:id',
	authenticateToken,
	authorizeRoles('coach'),
	validateObjectId('id'),
	deleteUser,
);

module.exports = router;
