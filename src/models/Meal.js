const mongoose = require("mongoose");

const mealItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le nom de l'aliment est requis"],
    trim: true,
  },
  icon: {
    type: String,
    trim: true,
    default: "",
  },
  quantity: {
    type: Number,
    required: [true, "La quantité est requise"],
    min: [0, "La quantité ne peut pas être négative"],
  },
  unit: {
    type: String,
    enum: ["g", "kg", "ml", "l", "piece", "cup", "tablespoon", "teaspoon"],
    required: [true, "L'unité est requise"],
  },
  calories: {
    type: Number,
    min: [0, "Les calories ne peuvent pas être négatives"],
    default: 0,
  },
  protein: {
    type: Number,
    min: [0, "Les protéines ne peuvent pas être négatives"],
    default: 0,
  },
  carbs: {
    type: Number,
    min: [0, "Les glucides ne peuvent pas être négatifs"],
    default: 0,
  },
  fat: {
    type: Number,
    min: [0, "Les lipides ne peuvent pas être négatifs"],
    default: 0,
  },
  fiber: {
    type: Number,
    min: [0, "Les fibres ne peuvent pas être négatives"],
    default: 0,
  },
});

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom du repas est requis"],
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
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: [true, "Le type de repas est requis"],
    },
    items: [mealItemSchema],
    totalCalories: {
      type: Number,
      min: [0, "Les calories totales ne peuvent pas être négatives"],
    },
    totalProtein: {
      type: Number,
      min: [0, "Les protéines totales ne peuvent pas être négatives"],
    },
    totalCarbs: {
      type: Number,
      min: [0, "Les glucides totaux ne peuvent pas être négatifs"],
    },
    totalFat: {
      type: Number,
      min: [0, "Les lipides totaux ne peuvent pas être négatifs"],
    },
    totalFiber: {
      type: Number,
      min: [0, "Les fibres totales ne peuvent pas être négatives"],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: {
      type: String,
      trim: true,
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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
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

// Index pour améliorer les performances
mealSchema.index({ name: 1 });
mealSchema.index({ type: 1 });
mealSchema.index({ status: 1 });
mealSchema.index({ isActive: 1 });
mealSchema.index({ createdBy: 1 });
mealSchema.index({ assignedTo: 1 });
mealSchema.index({ createdAt: -1 });

// Méthode pour calculer les totaux nutritionnels
mealSchema.methods.calculateTotals = function () {
  let totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  this.items.forEach((item) => {
    totals.calories += item.calories || 0;
    totals.protein += item.protein || 0;
    totals.carbs += item.carbs || 0;
    totals.fat += item.fat || 0;
    totals.fiber += item.fiber || 0;
  });

  this.totalCalories = Math.round(totals.calories);
  this.totalProtein = Math.round(totals.protein * 10) / 10;
  this.totalCarbs = Math.round(totals.carbs * 10) / 10;
  this.totalFat = Math.round(totals.fat * 10) / 10;
  this.totalFiber = Math.round(totals.fiber * 10) / 10;

  return totals;
};

// Middleware pour calculer les totaux avant sauvegarde
mealSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.calculateTotals();
  }
  next();
});

module.exports = mongoose.model("Meal", mealSchema);
