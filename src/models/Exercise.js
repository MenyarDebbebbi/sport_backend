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
      trim: true,
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
    },
    category: {
      type: String,
      enum: ["strength", "cardio", "flexibility", "balance", "sports"],
      required: [true, "La catégorie est requise"],
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
          "quads",
          "hamstrings",
          "calves",
          "glutes",
          "full_body",
        ],
      },
    ],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    equipment: [
      {
        type: String,
        enum: [
          "none",
          "dumbbells",
          "barbell",
          "kettlebell",
          "resistance_bands",
          "pull_up_bar",
          "bench",
          "treadmill",
          "bike",
          "rower",
          "yoga_mat",
        ],
      },
    ],
    instructions: [
      {
        type: String,
        trim: true,
      },
    ],
    tips: [
      {
        type: String,
        trim: true,
      },
    ],
    videoUrl: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // en minutes
      min: [1, "La durée doit être d'au moins 1 minute"],
    },
    calories: {
      type: Number,
      min: [0, "Les calories ne peuvent pas être négatives"],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour améliorer les performances
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ category: 1 });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ isActive: 1 });
exerciseSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Exercise", exerciseSchema);
