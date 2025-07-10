const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'entraînement est requis"],
      trim: true,
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
    },
    type: {
      type: String,
      required: [true, "Le type d'entraînement est requis"],
      enum: [
        "strength",
        "cardio",
        "flexibility",
        "hiit",
        "circuit",
        "endurance",
        "power",
        "recovery",
        "mixed",
      ],
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      required: [true, "Le niveau de difficulté est requis"],
    },
    duration: {
      type: Number,
      required: [true, "La durée est requise"],
      min: [5, "La durée doit être d'au moins 5 minutes"],
      max: [300, "La durée ne peut pas dépasser 300 minutes"],
    },
    exercises: [
      {
        exercise: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exercise",
          required: true,
        },
        sets: {
          type: Number,
          min: [1, "Le nombre de séries doit être d'au moins 1"],
          max: [50, "Le nombre de séries ne peut pas dépasser 50"],
        },
        reps: {
          type: Number,
          min: [1, "Le nombre de répétitions doit être d'au moins 1"],
          max: [1000, "Le nombre de répétitions ne peut pas dépasser 1000"],
        },
        duration: {
          type: Number,
          min: [1, "La durée doit être d'au moins 1 seconde"],
          max: [3600, "La durée ne peut pas dépasser 1 heure"],
        },
        weight: {
          type: Number,
          min: [0, "Le poids ne peut pas être négatif"],
          max: [1000, "Le poids ne peut pas dépasser 1000 kg"],
        },
        restTime: {
          type: Number,
          min: [0, "Le temps de repos ne peut pas être négatif"],
          max: [600, "Le temps de repos ne peut pas dépasser 10 minutes"],
        },
        order: {
          type: Number,
          required: true,
        },
        notes: {
          type: String,
          maxlength: [200, "Les notes ne peuvent pas dépasser 200 caractères"],
        },
      },
    ],
    targetMuscleGroups: [
      {
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
          "lower_back",
          "glutes",
          "quadriceps",
          "hamstrings",
          "calves",
          "full_body",
          "core",
        ],
      },
    ],
    equipment: [
      {
        type: String,
        enum: [
          "none",
          "dumbbells",
          "barbell",
          "kettlebell",
          "resistance_band",
          "pull_up_bar",
          "bench",
          "mat",
          "treadmill",
          "bicycle",
          "elliptical",
          "rower",
          "cable_machine",
          "smith_machine",
          "other",
        ],
      },
    ],
    calories: {
      type: Number,
      min: [0, "Les calories ne peuvent pas être négatives"],
      max: [5000, "Les calories ne peuvent pas dépasser 5000"],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [30, "Chaque tag ne peut pas dépasser 30 caractères"],
      },
    ],
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    completedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastCompleted: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour améliorer les performances
workoutSchema.index({ name: "text", description: "text", tags: "text" });
workoutSchema.index({ type: 1 });
workoutSchema.index({ difficulty: 1 });
workoutSchema.index({ targetMuscleGroups: 1 });
workoutSchema.index({ isPublic: 1 });
workoutSchema.index({ isActive: 1 });
workoutSchema.index({ createdBy: 1 });
workoutSchema.index({ "rating.average": -1 });
workoutSchema.index({ completedCount: -1 });
workoutSchema.index({ createdAt: -1 });

// Méthode pour calculer la durée totale
workoutSchema.methods.calculateTotalDuration = function () {
  let totalDuration = 0;
  this.exercises.forEach((exercise) => {
    if (exercise.duration) {
      totalDuration += exercise.duration;
    }
    if (exercise.restTime) {
      totalDuration += exercise.restTime;
    }
  });
  return totalDuration;
};

// Méthode pour calculer les calories estimées
workoutSchema.methods.calculateCalories = function () {
  let totalCalories = 0;
  this.exercises.forEach((exercise) => {
    if (exercise.duration && exercise.exercise.caloriesPerMinute) {
      totalCalories +=
        (exercise.duration / 60) * exercise.exercise.caloriesPerMinute;
    }
  });
  return Math.round(totalCalories);
};

// Méthode pour mettre à jour la note
workoutSchema.methods.updateRating = function (newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Méthode pour ajouter/retirer des favoris
workoutSchema.methods.toggleFavorite = function (userId) {
  const index = this.favorites.indexOf(userId);
  if (index > -1) {
    this.favorites.splice(index, 1);
  } else {
    this.favorites.push(userId);
  }
  return this.save();
};

// Méthode pour marquer comme terminé
workoutSchema.methods.markCompleted = function () {
  this.completedCount += 1;
  this.lastCompleted = new Date();
  return this.save();
};

// Méthode pour obtenir les entraînements populaires
workoutSchema.statics.getPopular = function (limit = 10) {
  return this.find({ isPublic: true, isActive: true })
    .sort({ "rating.average": -1, "rating.count": -1 })
    .limit(limit)
    .populate("createdBy", "username firstName lastName");
};

// Méthode pour rechercher des entraînements
workoutSchema.statics.search = function (query, filters = {}) {
  const searchQuery = {
    isPublic: true,
    isActive: true,
    $text: { $search: query },
  };

  if (filters.type) searchQuery.type = filters.type;
  if (filters.difficulty) searchQuery.difficulty = filters.difficulty;
  if (filters.targetMuscleGroups && filters.targetMuscleGroups.length > 0) {
    searchQuery.targetMuscleGroups = { $in: filters.targetMuscleGroups };
  }
  if (filters.equipment && filters.equipment.length > 0) {
    searchQuery.equipment = { $in: filters.equipment };
  }
  if (filters.maxDuration) {
    searchQuery.duration = { $lte: filters.maxDuration };
  }

  return this.find(searchQuery)
    .sort({ score: { $meta: "textScore" } })
    .populate("createdBy", "username firstName lastName")
    .populate("exercises.exercise", "name description category difficulty");
};

module.exports = mongoose.model("Workout", workoutSchema);
