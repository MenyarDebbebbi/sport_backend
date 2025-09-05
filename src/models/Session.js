const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de la séance est requis"],
      trim: true,
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
    },
    duration: {
      type: Number,
      min: [1, "La durée doit être d'au moins 1 minute"],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sessionSchema.index({ name: 1 });
sessionSchema.index({ type: 1 });
sessionSchema.index({ difficulty: 1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ isPublic: 1 });
sessionSchema.index({ createdBy: 1 });
sessionSchema.index({ assignedTo: 1 });
sessionSchema.index({ createdAt: -1 });

// Virtual pour récupérer les exercices associés à cette séance
sessionSchema.virtual("exercises", {
  ref: "Workout",
  localField: "_id",
  foreignField: "sessionId",
});

sessionSchema.virtual("combinedWorkouts", {
  ref: "CombinedWorkout",
  localField: "_id",
  foreignField: "sessionId",
});

sessionSchema.methods.calculateTotalDuration = function () {
  return this.duration || 0;
};

module.exports = mongoose.model("Session", sessionSchema);
