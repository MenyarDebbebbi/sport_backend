const Meal = require("../models/Meal");

// Obtenir tous les repas (avec pagination et filtres)
const getAllMeals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtres
    const filters = { isActive: true };
    if (req.query.type) filters.type = req.query.type;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Si l'utilisateur n'est pas admin/coach, ne montrer que ses propres repas
    if (req.user && req.user.role === "user") {
      filters.createdBy = req.user._id;
    }

    const meals = await Meal.find(filters)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("reviewedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Meal.countDocuments(filters);

    res.json({
      meals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des repas:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la récupération des repas",
    });
  }
};

// Obtenir un repas par ID
const getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("reviewedBy", "firstName lastName");

    if (!meal) {
      return res.status(404).json({
        error: "Repas non trouvé",
        message: "Le repas demandé n'existe pas",
      });
    }

    // Vérifier les permissions
    if (
      req.user &&
      req.user.role === "user" &&
      meal.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        error: "Accès refusé",
        message: "Vous n'avez pas accès à ce repas",
      });
    }

    res.json({ meal });
  } catch (error) {
    console.error("Erreur lors de la récupération du repas:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la récupération du repas",
    });
  }
};

// Créer un nouveau repas
const Notification = require("../models/Notification");

const createMeal = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      items,
      imageUrl,
      assignedTo,
      tags,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
    } = req.body;

    console.log("assignedTo", assignedTo);

    const meal = new Meal({
      name,
      description,
      type,
      items,
      imageUrl,
      assignedTo,
      tags,
      createdBy: req.user._id,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
    });

    await meal.save();

    // Populate les relations pour la réponse
    await meal.populate("createdBy", "firstName lastName");
    await meal.populate("assignedTo", "firstName lastName");

    // Créer une notification pour l'utilisateur assigné (si présent)
    try {
      if (meal.assignedTo) {
        await Notification.create({
          recipient: meal.assignedTo,
          sender: req.user?._id || null,
          type: "meal_action",
          title: "Nouveau repas attribué",
          message: `Votre coach a ajouté un repas: ${meal.name}`,
          entity: {
            entityType: "meal",
            entityId: String(meal._id),
            extra: { type: meal.type },
          },
        });
      }
    } catch (notifyErr) {
      // Ne pas bloquer la réponse en cas d'erreur de notification
      console.error("Erreur création notification (meal):", notifyErr);
    }

    res.status(201).json({
      message: "Repas créé avec succès",
      meal,
    });
  } catch (error) {
    console.error("Erreur lors de la création du repas:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        error: "Données invalides",
        message: "Veuillez corriger les erreurs suivantes",
        errors,
      });
    }

    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la création du repas",
    });
  }
};

// Mettre à jour un repas
const updateMeal = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      items,
      imageUrl,
      assignedTo,
      tags,
      isActive,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
    } = req.body;

    const updateData = {
      name,
      description,
      type,
      items,
      imageUrl,
      assignedTo,
      tags,
      isActive,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
    };

    // Supprimer les champs undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const meal = await Meal.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("reviewedBy", "firstName lastName");

    if (!meal) {
      return res.status(404).json({
        error: "Repas non trouvé",
        message: "Le repas demandé n'existe pas",
      });
    }

    res.json({
      message: "Repas mis à jour avec succès",
      meal,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du repas:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        error: "Données invalides",
        message: "Veuillez corriger les erreurs suivantes",
        errors,
      });
    }

    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la mise à jour du repas",
    });
  }
};

// Supprimer un repas
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);

    if (!meal) {
      return res.status(404).json({
        error: "Repas non trouvé",
        message: "Le repas demandé n'existe pas",
      });
    }

    res.json({
      message: "Repas supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du repas:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la suppression du repas",
    });
  }
};

// Approuver/Rejeter un repas (pour les coachs/admins)
const reviewMeal = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Statut invalide",
        message: "Le statut doit être 'approved' ou 'rejected'",
      });
    }

    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes,
        reviewedBy: req.user._id,
      },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("reviewedBy", "firstName lastName");

    if (!meal) {
      return res.status(404).json({
        error: "Repas non trouvé",
        message: "Le repas demandé n'existe pas",
      });
    }

    res.json({
      message: `Repas ${
        status === "approved" ? "approuvé" : "rejeté"
      } avec succès`,
      meal,
    });
  } catch (error) {
    console.error("Erreur lors de la révision du repas:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la révision du repas",
    });
  }
};

// Obtenir les repas d'un utilisateur
const getUserMealsForCoach = async (req, res) => {
  try {
    const userId = req.params.userId || (req.user ? req.user._id : null);

    const query = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      isActive: true,
    };

    const meals = await Meal.find(query)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("reviewedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({ meals });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des repas de l'utilisateur:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la récupération des repas",
    });
  }
};

// Obtenir les repas d'un utilisateur
const getUserMeals = async (req, res) => {
  try {
    const userId = req.params.userId || (req.user ? req.user._id : null);

    const query = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      isActive: true,
      status: "approved",
    };

    const meals = await Meal.find(query)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("reviewedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({ meals });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des repas de l'utilisateur:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la récupération des repas",
    });
  }
};

// Obtenir les repas par type
const getMealsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const filters = {
      type,
      isActive: true,
    };

    // Si l'utilisateur n'est pas admin/coach, ne montrer que ses propres repas
    if (req.user && req.user.role === "user") {
      filters.createdBy = req.user._id;
    }

    const meals = await Meal.find(filters)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("reviewedBy", "firstName lastName")
      .sort({ name: 1 });

    res.json({ meals });
  } catch (error) {
    console.error("Erreur lors de la récupération des repas par type:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la récupération des repas",
    });
  }
};

// Obtenir les statistiques des repas
const getMealStats = async (req, res) => {
  try {
    const totalMeals = await Meal.countDocuments();
    const activeMeals = await Meal.countDocuments({ isActive: true });
    const pendingMeals = await Meal.countDocuments({ status: "pending" });
    const approvedMeals = await Meal.countDocuments({ status: "approved" });
    const rejectedMeals = await Meal.countDocuments({ status: "rejected" });

    const mealsByType = await Meal.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentMeals = await Meal.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      stats: {
        total: totalMeals,
        active: activeMeals,
        pending: pendingMeals,
        approved: approvedMeals,
        rejected: rejectedMeals,
        recent: recentMeals,
        byType: mealsByType,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des statistiques",
    });
  }
};

module.exports = {
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  reviewMeal,
  getUserMeals,
  getUserMealsForCoach,
  getMealsByType,
  getMealStats,
};
