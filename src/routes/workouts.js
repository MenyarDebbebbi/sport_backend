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
	getWorkoutsBySession,
	createWorkoutInSession,
	updateWorkoutOrder,
	createCombinedWorkout,
	getCombinedWorkoutById,
	updateCombinedWorkout,
	deleteCombinedWorkout,
	getUserCombinedWorkouts,
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

// Validation spécifique pour les exercices dans les séances
const sessionExerciseValidation = [
	body('name')
		.trim()
		.isLength({ min: 1, max: 100 })
		.withMessage('Le nom doit contenir entre 1 et 100 caractères'),

	body('description')
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage('La description ne peut pas dépasser 500 caractères'),

	body('muscleGroup')
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

	body('type')
		.optional()
		.isIn(['strength', 'cardio', 'flexibility', 'mixed', 'custom'])
		.withMessage('Type invalide'),

	body('difficulty')
		.optional()
		.isIn(['beginner', 'intermediate', 'advanced'])
		.withMessage('Difficulté invalide'),

	body('sets')
		.optional()
		.isInt({ min: 1 })
		.withMessage("Le nombre de séries doit être d'au moins 1"),

	body('repetitions')
		.optional({ nullable: true })
		.isInt({ min: 1 })
		.withMessage("Le nombre de répétitions doit être d'au moins 1"),

	body('weight')
		.optional({ nullable: true })
		.isFloat({ min: 0 })
		.withMessage('Le poids ne peut pas être négatif'),

	body('duration')
		.optional({ nullable: true })
		.isInt({ min: 1 })
		.withMessage("La durée doit être d'au moins 1 seconde"),

	body('rest')
		.optional({ nullable: true })
		.isInt({ min: 0 })
		.withMessage('Le temps de repos ne peut pas être négatif'),

	body('notes')
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage('Les notes ne peuvent pas dépasser 500 caractères'),

	body('gifUrl').optional().isURL().withMessage('URL GIF invalide'),

	// Validations pour les exercices combinés
	body('isCombinedExercise')
		.optional()
		.isBoolean()
		.withMessage('isCombinedExercise doit être un booléen'),

	body('secondaryGifUrl').optional().isURL().withMessage('URL du deuxième GIF invalide'),

	body('secondaryExercise.name')
		.optional()
		.trim()
		.isLength({ min: 1, max: 100 })
		.withMessage('Le nom du deuxième exercice doit contenir entre 1 et 100 caractères'),

	body('secondaryExercise.description')
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage('La description du deuxième exercice ne peut pas dépasser 500 caractères'),

	body('secondaryExercise.category')
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage('La catégorie du deuxième exercice ne peut pas dépasser 100 caractères'),
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
router.post(
	'/combined',
	authenticateToken,
	authorizeRoles('coach'),
	workoutValidation,
	handleValidationErrors,
	createCombinedWorkout,
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

// Routes spécifiques aux séances
router.get(
	'/session/:sessionId',
	authenticateToken,
	validateObjectId('sessionId'),
	getWorkoutsBySession,
);

router.post(
	'/session/:sessionId',
	authenticateToken,
	authorizeRoles('coach'),
	validateObjectId('sessionId'),
	sessionExerciseValidation,
	handleValidationErrors,
	createWorkoutInSession,
);

// Créer un programme combiné DANS une séance
router.post(
	'/session/:sessionId/combined',
	authenticateToken,
	authorizeRoles('coach'),
	validateObjectId('sessionId'),
	handleValidationErrors,
	(req, res, next) => {
		// déférer au contrôleur existant, en injectant sessionId dans le body
		req.body.sessionId = req.params.sessionId;
		return createCombinedWorkout(req, res, next);
	},
);

router.put(
	'/session/:sessionId/order',
	authenticateToken,
	authorizeRoles('coach'),
	validateObjectId('sessionId'),
	body('workoutId').isMongoId().withMessage("ID d'exercice invalide"),
	body('newOrder').isInt({ min: 1 }).withMessage("L'ordre doit être un entier positif"),
	handleValidationErrors,
	updateWorkoutOrder,
);

// Routes pour les programmes combinés
router.get('/combined/:id', authenticateToken, validateObjectId('id'), getCombinedWorkoutById);

router.put(
	'/combined/:id',
	authenticateToken,
	authorizeRoles('coach'),
	validateObjectId('id'),
	handleValidationErrors,
	updateCombinedWorkout,
);

router.delete(
	'/combined/:id',
	authenticateToken,
	authorizeRoles('coach'),
	validateObjectId('id'),
	deleteCombinedWorkout,
);

router.get('/combined/user/:userId?', authenticateToken, getUserCombinedWorkouts);

module.exports = router;
