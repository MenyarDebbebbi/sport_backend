const mongoose = require("mongoose");

// Subdocument schema for embedded exercises inside a workout
const workoutExerciseSchema = new mongoose.Schema(
  {
    exercise: {
      name: {
        type: String,
        required: [true, "Le nom de l'exercice est requis"],
        trim: true,
        maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
      },
      category: {
        type: String,
        trim: true,
      },
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
      },
      gifUrl: {
        type: String,
        trim: true,
      },
      // Pour les exercices combinés - deuxième GIF
      secondaryGifUrl: {
        type: String,
        trim: true,
      },
      // Indique si c'est un exercice combiné
      isCombinedExercise: {
        type: Boolean,
        default: false,
      },
      // Informations pour le deuxième exercice si c'est un exercice combiné
      secondaryExercise: {
        name: {
          type: String,
          trim: true,
          maxlength: [
            100,
            "Le nom du deuxième exercice ne peut pas dépasser 100 caractères",
          ],
        },
        description: {
          type: String,
          trim: true,
          maxlength: [
            500,
            "La description du deuxième exercice ne peut pas dépasser 500 caractères",
          ],
        },
        category: {
          type: String,
          trim: true,
        },
      },
    },
    sets: {
      type: Number,
      min: [1, "Le nombre de séries doit être d'au moins 1"],
    },
    repetitions: {
      type: Number,
      min: [1, "Le nombre de répétitions doit être d'au moins 1"],
    },
    weight: {
      type: Number,
      min: [0, "Le poids ne peut pas être négatif"],
      default: 0,
    },
    duration: {
      type: Number, // en secondes
      min: [1, "La durée doit être d'au moins 1 seconde"],
    },
    rest: {
      type: Number, // en secondes
      min: [0, "Le temps de repos ne peut pas être négatif"],
    },
    notes: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      min: [1, "L'ordre doit être d'au moins 1"],
    },
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'exercice est requis"],
      trim: true,
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
    },
    muscleGroup: {
      type: String,
      enum: [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "forearms",
        "abs",
        "obliques",
        "quads",
        "hamstrings",
        "calves",
        "glutes",
        "full_body",
      ],
      // optionnel pour permettre des workouts composés d'exercices variés
    },
    type: {
      type: String,
      enum: ["strength", "cardio", "flexibility", "mixed", "custom"],
      default: "mixed",
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    duration: {
      type: Number, // en secondes
      min: [1, "La durée doit être d'au moins 1 seconde"],
    },
    sets: {
      type: Number,
      min: [1, "Le nombre de séries doit être d'au moins 1"],
      default: 3,
    },
    repetitions: {
      type: Number,
      min: [1, "Le nombre de répétitions doit être d'au moins 1"],
      default: 12,
    },
    weight: {
      type: Number,
      min: [0, "Le poids ne peut pas être négatif"],
      default: 0,
    },
    rest: {
      type: Number, // en secondes
      min: [0, "Le temps de repos ne peut pas être négatif"],
      default: 60,
    },
    gifUrl: {
      type: String,
      trim: true,
    },
    // Pour les exercices combinés - deuxième GIF
    secondaryGifUrl: {
      type: String,
      trim: true,
    },
    // Indique si c'est un exercice combiné (2 exercices en 1)
    isCombinedExercise: {
      type: Boolean,
      default: false,
    },
    // Informations pour le deuxième exercice si c'est un exercice combiné
    secondaryExercise: {
      name: {
        type: String,
        trim: true,
        maxlength: [
          100,
          "Le nom du deuxième exercice ne peut pas dépasser 100 caractères",
        ],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [
          500,
          "La description du deuxième exercice ne peut pas dépasser 500 caractères",
        ],
      },
      category: {
        type: String,
        trim: true,
      },
    },
    instructions: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    // Liste d'exercices intégrés
    exercises: [workoutExerciseSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // Référence vers la séance (foreign key)
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
    // Ordre dans la séance
    order: {
      type: Number,
      min: [1, "L'ordre doit être d'au moins 1"],
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour améliorer les performances
workoutSchema.index({ name: 1 });
workoutSchema.index({ type: 1 });
workoutSchema.index({ difficulty: 1 });
workoutSchema.index({ isActive: 1 });
workoutSchema.index({ isPublic: 1 });
workoutSchema.index({ createdBy: 1 });
workoutSchema.index({ assignedTo: 1 });
workoutSchema.index({ createdAt: -1 });
workoutSchema.index({ sessionId: 1 });
workoutSchema.index({ sessionId: 1, order: 1 });

// Méthode pour calculer la durée totale de l'entraînement
workoutSchema.methods.calculateTotalDuration = function () {
  if (this.duration) return this.duration;

  let totalDuration = 0;
  this.exercises.forEach((exercise) => {
    if (exercise.duration) {
      totalDuration += exercise.duration * exercise.sets;
    }
    if (exercise.rest) {
      totalDuration += exercise.rest * (exercise.sets - 1);
    }
  });

  return Math.ceil(totalDuration / 60); // Convertir en minutes
};

// Méthode pour obtenir les exercices avec leurs détails
workoutSchema.methods.getExercisesWithDetails = async function () {
  // Les exercices sont intégrés, pas de population nécessaire
  return this.exercises || [];
};

module.exports = mongoose.model("Workout", workoutSchema);
