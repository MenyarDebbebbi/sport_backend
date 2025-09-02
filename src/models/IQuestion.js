const mongoose = require("mongoose");

const iQuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'ID utilisateur est requis"],
      index: true,
    },

    // Questions cardiovasculaires
    bloodPressure: {
      systolic: {
        type: Number,
        min: [70, "La pression systolique doit être d'au moins 70 mmHg"],
        max: [200, "La pression systolique ne peut pas dépasser 200 mmHg"],
      },
      diastolic: {
        type: Number,
        min: [40, "La pression diastolique doit être d'au moins 40 mmHg"],
        max: [130, "La pression diastolique ne peut pas dépasser 130 mmHg"],
      },
    },

    restingHeartRate: {
      type: Number,
      min: [40, "La fréquence cardiaque doit être d'au moins 40 bpm"],
      max: [120, "La fréquence cardiaque ne peut pas dépasser 120 bpm"],
    },

    // Tests de fitness
    cardioTest: {
      type: Number,
      min: [1, "Le test cardio doit être d'au moins 1 minute"],
      max: [60, "Le test cardio ne peut pas dépasser 60 minutes"],
    },

    pushupsPerMinute: {
      type: Number,
      min: [0, "Le nombre de pompes ne peut pas être négatif"],
      max: [100, "Le nombre de pompes ne peut pas dépasser 100 par minute"],
    },

    situpsPerMinute: {
      type: Number,
      min: [0, "Le nombre d'abdominaux ne peut pas être négatif"],
      max: [100, "Le nombre d'abdominaux ne peut pas dépasser 100 par minute"],
    },

    stretching: {
      type: Number,
      min: [0, "L'étirement ne peut pas être négatif"],
      max: [50, "L'étirement ne peut pas dépasser 50 cm"],
    },

    // Composition corporelle
    bodyFatPercentage: {
      type: Number,
      min: [5, "Le pourcentage de graisse corporelle doit être d'au moins 5%"],
      max: [
        50,
        "Le pourcentage de graisse corporelle ne peut pas dépasser 50%",
      ],
    },

    bodyWeight: {
      type: Number,
      min: [30, "Le poids doit être d'au moins 30 kg"],
      max: [200, "Le poids ne peut pas dépasser 200 kg"],
    },

    // Questions médicales (oui/non)
    heartProblems: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    chestPainDuringExercise: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    chestPainLastMonth: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    dizzinessOrFainting: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    jointProblems: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    bloodPressureOrHeartMedication: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    type1Diabetes: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    otherExerciseRestrictions: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    // Allergies
    hasAllergies: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    allergiesDetails: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Les détails des allergies ne peuvent pas dépasser 1000 caractères",
      ],
    },

    // Métadonnées
    isComplete: {
      type: Boolean,
      default: false,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // Score de risque calculé
    riskScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    riskLevel: {
      type: String,
      enum: ["low", "moderate", "high"],
      default: "low",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour optimiser les requêtes
iQuestionSchema.index({ userId: 1 });
iQuestionSchema.index({ createdAt: -1 });
iQuestionSchema.index({ riskLevel: 1 });

// Méthode pour calculer le score de risque
iQuestionSchema.methods.calculateRiskScore = function () {
  let score = 0;

  // Problèmes cardiaques (poids élevé)
  if (this.heartProblems === "yes") score += 3;
  if (this.chestPainDuringExercise === "yes") score += 3;
  if (this.chestPainLastMonth === "yes") score += 2;
  if (this.dizzinessOrFainting === "yes") score += 2;
  if (this.bloodPressureOrHeartMedication === "yes") score += 2;
  if (this.type1Diabetes === "yes") score += 1;

  // Problèmes articulaires
  if (this.jointProblems === "yes") score += 1;

  // Autres restrictions
  if (this.otherExerciseRestrictions === "yes") score += 1;

  this.riskScore = Math.min(score, 10);

  // Déterminer le niveau de risque
  if (this.riskScore >= 6) {
    this.riskLevel = "high";
  } else if (this.riskScore >= 3) {
    this.riskLevel = "moderate";
  } else {
    this.riskLevel = "low";
  }

  return this.riskScore;
};

// Méthode pour vérifier si le questionnaire est complet
iQuestionSchema.methods.isQuestionnaireComplete = function () {
  const requiredFields = [
    "bloodPressure.systolic",
    "bloodPressure.diastolic",
    "restingHeartRate",
    "bodyWeight",
    "heartProblems",
    "chestPainDuringExercise",
    "chestPainLastMonth",
    "dizzinessOrFainting",
    "jointProblems",
    "bloodPressureOrHeartMedication",
    "type1Diabetes",
    "otherExerciseRestrictions",
    "hasAllergies",
  ];

  for (const field of requiredFields) {
    const value = this.get(field);
    if (value === undefined || value === null || value === "") {
      return false;
    }
  }

  // Vérifier les allergies si oui
  if (
    this.hasAllergies === "yes" &&
    (!this.allergiesDetails || this.allergiesDetails.trim() === "")
  ) {
    return false;
  }

  return true;
};

// Middleware pour calculer automatiquement le score de risque
iQuestionSchema.pre("save", function (next) {
  this.calculateRiskScore();
  this.isComplete = this.isQuestionnaireComplete();
  this.lastUpdated = new Date();
  next();
});

// Méthode virtuelle pour obtenir le statut de la pression artérielle
iQuestionSchema.virtual("bloodPressureStatus").get(function () {
  if (!this.bloodPressure.systolic || !this.bloodPressure.diastolic) {
    return "unknown";
  }

  const systolic = this.bloodPressure.systolic;
  const diastolic = this.bloodPressure.diastolic;

  if (systolic < 120 && diastolic < 80) return "normal";
  if (systolic < 130 && diastolic < 80) return "elevated";
  if (systolic >= 130 || diastolic >= 80) return "high";

  return "unknown";
});

// Méthode virtuelle pour obtenir le statut de la fréquence cardiaque
iQuestionSchema.virtual("heartRateStatus").get(function () {
  if (!this.restingHeartRate) return "unknown";

  const hr = this.restingHeartRate;
  if (hr < 60) return "bradycardia";
  if (hr >= 60 && hr <= 100) return "normal";
  if (hr > 100) return "tachycardia";

  return "unknown";
});

// Méthode pour obtenir les recommandations basées sur le profil
iQuestionSchema.methods.getRecommendations = function () {
  const recommendations = [];

  if (this.riskLevel === "high") {
    recommendations.push(
      "Consultation médicale recommandée avant de commencer un programme d'exercice"
    );
    recommendations.push("Éviter les exercices de haute intensité");
    recommendations.push("Surveillance médicale pendant l'exercice");
  } else if (this.riskLevel === "moderate") {
    recommendations.push("Consultation médicale suggérée");
    recommendations.push("Commencer par des exercices de faible intensité");
    recommendations.push("Surveillance régulière des signes vitaux");
  } else {
    recommendations.push("Programme d'exercice standard recommandé");
    recommendations.push("Progression graduelle de l'intensité");
  }

  if (this.jointProblems === "yes") {
    recommendations.push("Éviter les exercices à fort impact");
    recommendations.push(
      "Privilégier les exercices en piscine ou à faible impact"
    );
  }

  if (this.hasAllergies === "yes") {
    recommendations.push("Informer l'équipe médicale de vos allergies");
    recommendations.push(
      "Avoir un plan d'urgence en cas de réaction allergique"
    );
  }

  return recommendations;
};

module.exports = mongoose.model("IQuestion", iQuestionSchema);
