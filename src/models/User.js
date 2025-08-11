const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: false,
			unique: true,
			trim: true,
			minlength: [3, "Le nom d'utilisateur doit contenir au moins 3 caractères"],
			maxlength: [30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères"],
		},
		email: {
			type: String,
			required: [true, "L'email est requis"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez entrer un email valide'],
		},
		password: {
			type: String,
			required: [true, 'Le mot de passe est requis'],
			minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
		},
		firstName: {
			type: String,
			required: [true, 'Le prénom est requis'],
			trim: true,
			maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
		},
		lastName: {
			type: String,
			required: [true, 'Le nom de famille est requis'],
			trim: true,
			maxlength: [50, 'Le nom de famille ne peut pas dépasser 50 caractères'],
		},
		profilePicture: {
			type: String,
			default: null,
		},
		dateOfBirth: {
			type: Date,
			required: false,
		},
		gender: {
			type: String,
			enum: ['male', 'female', 'other'],
			required: false,
		},
		phone: {
			type: String,
			trim: true,
		},
		city: {
			type: String,
			trim: true,
		},
		height: {
			type: Number,
			min: [50, "La taille doit être d'au moins 50 cm"],
			max: [300, 'La taille ne peut pas dépasser 300 cm'],
		},
		weight: {
			type: Number,
			min: [20, "Le poids doit être d'au moins 20 kg"],
			max: [500, 'Le poids ne peut pas dépasser 500 kg'],
		},
		// Informations de santé
		healthInfo: {
			bloodPressure: {
				type: String,
				enum: ['normal', 'high', 'very_high'],
				default: 'normal',
			},
			diabetes: {
				type: Boolean,
				default: false,
			},
			cholesterol: {
				type: String,
				enum: ['normal', 'high', 'very_high'],
				default: 'normal',
			},
			allergies: {
				type: String,
				trim: true,
			},
			medications: {
				type: String,
				trim: true,
			},
			medicalHistory: {
				type: String,
				trim: true,
			},
		},
		fitnessLevel: {
			type: String,
			enum: ['beginner', 'intermediate', 'advanced', 'expert'],
			default: 'beginner',
		},
		goals: [
			{
				type: String,
				enum: [
					'weight_loss',
					'muscle_gain',
					'endurance',
					'flexibility',
					'strength',
					'general_fitness',
				],
			},
		],
		status: {
			type: String,
			enum: ['active', 'pending', 'inactive'],
			default: 'pending',
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		role: {
			type: String,
			enum: ['user', 'coach'],
			default: 'user',
		},
		assignedCoach: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		pack: {
			id: { type: Number, default: null },
			title: { type: String, trim: true, default: null },
			level: { type: String, trim: true, default: null },
			price: { type: Number, default: null, min: 0 },
			duration: { type: String, trim: true, default: null },
			selectedAt: { type: Date, default: null },
		},
		lastLogin: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

// Méthode pour hasher le mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();

	try {
		const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir le nom complet
userSchema.virtual('fullName').get(function () {
	return `${this.firstName} ${this.lastName}`;
});

// Méthode pour calculer l'âge
userSchema.virtual('age').get(function () {
	if (!this.dateOfBirth) return null;
	const today = new Date();
	const birthDate = new Date(this.dateOfBirth);
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}

	return age;
});

// Méthode pour obtenir les informations publiques de l'utilisateur
userSchema.methods.toPublicJSON = function () {
	const user = this.toObject();
	delete user.password;
	delete user.__v;
	return user;
};

module.exports = mongoose.model('User', userSchema);
