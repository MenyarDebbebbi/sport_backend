const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'exercice est requis"],
      trim: true,
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },
    description: {
      type: String,
      required: [true, "La description est requise"],
      trim: true,
      maxlength: [1000, "La description ne peut pas dépasser 1000 caractères"],
    },
    category: {
      type: String,
      required: [true, "La catégorie est requise"],
      enum: [
        "strength",
        "cardio",
        "flexibility",
        "balance",
        "sports",
        "yoga",
        "pilates",
        "hiit",
        "calisthenics",
        "other",
      ],
    },
    muscleGroups: [
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
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      required: [true, "Le niveau de difficulté est requis"],
    },
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
    instructions: [
      {
        step: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
          maxlength: [
            500,
            "Chaque instruction ne peut pas dépasser 500 caractères",
          ],
        },
      },
    ],
    tips: [
      {
        type: String,
        maxlength: [300, "Chaque conseil ne peut pas dépasser 300 caractères"],
      },
    ],
    videoUrl: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "L'URL de la vidéo doit être valide",
      },
    },
    imageUrl: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "L'URL de l'image doit être valide",
      },
    },
    duration: {
      type: Number,
      min: [1, "La durée doit être d'au moins 1 minute"],
      max: [300, "La durée ne peut pas dépasser 300 minutes"],
    },
    caloriesPerMinute: {
      type: Number,
      min: [0, "Les calories par minute ne peuvent pas être négatives"],
      max: [50, "Les calories par minute ne peuvent pas dépasser 50"],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour améliorer les performances
exerciseSchema.index({ name: "text", description: "text", tags: "text" });
exerciseSchema.index({ category: 1 });
exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ isActive: 1 });
exerciseSchema.index({ "rating.average": -1 });
exerciseSchema.index({ createdAt: -1 });

// Méthode pour calculer la note moyenne
exerciseSchema.methods.updateRating = function (newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Méthode pour ajouter/retirer des favoris
exerciseSchema.methods.toggleFavorite = function (userId) {
  const index = this.favorites.indexOf(userId);
  if (index > -1) {
    this.favorites.splice(index, 1);
  } else {
    this.favorites.push(userId);
  }
  return this.save();
};

// Méthode pour vérifier si un exercice est en favori
exerciseSchema.methods.isFavorite = function (userId) {
  return this.favorites.includes(userId);
};

// Méthode pour obtenir les exercices populaires
exerciseSchema.statics.getPopular = function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ "rating.average": -1, "rating.count": -1 })
    .limit(limit);
};

// Méthode pour rechercher des exercices
exerciseSchema.statics.search = function (query, filters = {}) {
  const searchQuery = {
    isActive: true,
    $text: { $search: query },
  };

  if (filters.category) searchQuery.category = filters.category;
  if (filters.difficulty) searchQuery.difficulty = filters.difficulty;
  if (filters.muscleGroups && filters.muscleGroups.length > 0) {
    searchQuery.muscleGroups = { $in: filters.muscleGroups };
  }
  if (filters.equipment && filters.equipment.length > 0) {
    searchQuery.equipment = { $in: filters.equipment };
  }

  return this.find(searchQuery)
    .sort({ score: { $meta: "textScore" } })
    .populate("createdBy", "username firstName lastName");
};

module.exports = mongoose.model("Exercise", exerciseSchema);
