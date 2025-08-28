const mongoose = require('mongoose');

const combinedWorkoutSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Le nom est requis'],
			trim: true,
			maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
		},
		description: {
			type: String,
			trim: true,
			maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
		},
		// Liste des workouts inclus dans ce CombinedWorkout
		workouts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Workout',
				required: true,
			},
		],
		// Créé par (coach)
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		// Attribué à un ou plusieurs utilisateurs
		assignedTo: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
		isPublic: {
			type: Boolean,
			default: false,
		},
		tags: [
			{
				type: String,
				trim: true,
			},
		],
		notes: {
			type: String,
			trim: true,
			maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères'],
		},
		// Optionnel: période de validité/planification
		startDate: {
			type: Date,
		},
		endDate: {
			type: Date,
		},
		// Lien vers la séance (les programmes combinés vivent dans une séance)
		sessionId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Session',
			default: null,
		},
		// Ordre dans la séance
		order: {
			type: Number,
			min: 1,
			default: 1,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// Index pour recherches rapides
combinedWorkoutSchema.index({ name: 1 });
combinedWorkoutSchema.index({ createdBy: 1 });
combinedWorkoutSchema.index({ isActive: 1 });
combinedWorkoutSchema.index({ isPublic: 1 });
combinedWorkoutSchema.index({ assignedTo: 1 });
combinedWorkoutSchema.index({ createdAt: -1 });
combinedWorkoutSchema.index({ sessionId: 1 });
combinedWorkoutSchema.index({ sessionId: 1, order: 1 });

// Nombre de workouts
combinedWorkoutSchema.virtual('workoutCount').get(function () {
	return Array.isArray(this.workouts) ? this.workouts.length : 0;
});

module.exports = mongoose.model('CombinedWorkout', combinedWorkoutSchema);
