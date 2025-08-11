const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleValidationErrors, validateObjectId } = require('../middleware/validation');
const {
	getAllWorkouts,
	getWorkoutById,
	createWorkout,
	updateWorkout,
	deleteWorkout,
	getUserWorkouts,
	getWorkoutsByType,
	getWorkoutStats,
} = require('../controllers/workoutController');

// Validation pour les entraînements
const workoutValidation = [
	body('name')
		.trim()
		.isLength({ min: 1, max: 100 })
		.withMessage('Le nom doit contenir entre 1 et 100 caractères'),

	body('description')
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage('La description ne peut pas dépasser 500 caractères'),

	body('type')
		.optional()
		.isIn(['strength', 'cardio', 'flexibility', 'mixed', 'custom'])
		.withMessage('Type invalide'),

	body('difficulty')
		.optional()
		.isIn(['beginner', 'intermediate', 'advanced'])
		.withMessage('Difficulté invalide'),

	body('duration')
		.optional()
		.isFloat({ min: 1 })
		.withMessage("La durée doit être d'au moins 1 minute"),

	body('exercises').optional().isArray().withMessage('Les exercices doivent être un tableau'),

	body('exercises.*.exerciseName')
		.optional()
		.trim()
		.isLength({ min: 1, max: 100 })
		.withMessage("Le nom de l'exercice doit contenir entre 1 et 100 caractères"),

	body('exercises.*.exerciseDescription')
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage("La description de l'exercice ne peut pas dépasser 500 caractères"),

	body('exercises.*.muscleGroup')
		.optional()
		.isIn([
			'chest',
			'back',
			'shoulders',
			'biceps',
			'triceps',
			'forearms',
			'abs',
			'obliques',
			'quads',
			'hamstrings',
			'calves',
			'glutes',
			'full_body',
		])
		.withMessage('Groupe musculaire invalide'),

	body('exercises.*.gifUrl').optional().isURL().withMessage('URL GIF invalide'),

	body('exercises.*.sets')
		.optional()
		.isInt({ min: 1 })
		.withMessage("Le nombre de séries doit être d'au moins 1"),

	body('exercises.*.repetitions')
		.optional()
		.isInt({ min: 1 })
		.withMessage("Le nombre de répétitions doit être d'au moins 1"),

	body('exercises.*.weight')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Le poids ne peut pas être négatif'),

	body('exercises.*.duration')
		.optional()
		.isFloat({ min: 1 })
		.withMessage("La durée doit être d'au moins 1 seconde"),

	body('exercises.*.rest')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Le temps de repos ne peut pas être négatif'),

	body('exercises.*.order')
		.optional()
		.isInt({ min: 1 })
		.withMessage("L'ordre doit être d'au moins 1"),

	body('isPublic').optional().isBoolean().withMessage('isPublic doit être un booléen'),

	body('assignedTo').optional().isArray().withMessage('assignedTo doit être un tableau'),

	body('assignedTo.*').optional().isMongoId().withMessage("ID d'utilisateur invalide"),

	body('tags').optional().isArray().withMessage('Les tags doivent être un tableau'),
];

// Routes publiques
router.get('/type/:type', getWorkoutsByType);
router.get('/stats', getWorkoutStats);
router.get('/:id', validateObjectId('id'), getWorkoutById);

// Routes protégées
router.get('/', authenticateToken, getAllWorkouts);

// Routes protégées
router.get('/user/:userId?', authenticateToken, getUserWorkouts);

// Routes admin/coach seulement
router.post(
	'/',
	authenticateToken,
	authorizeRoles('coach'),
	workoutValidation,
	handleValidationErrors,
	createWorkout,
);
router.put(
	'/:id',
	authenticateToken,
	authorizeRoles('coach'),
	validateObjectId('id'),
	workoutValidation,
	handleValidationErrors,
	updateWorkout,
);
router.delete(
	'/:id',
	authenticateToken,
	authorizeRoles('coach'),
	validateObjectId('id'),
	deleteWorkout,
);

module.exports = router;
