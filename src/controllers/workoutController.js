const Workout = require("../models/Workout");

// Obtenir tous les entraînements (avec pagination et filtres)
const getAllWorkouts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtres
    const filters = { isActive: true };
    if (req.query.type) filters.type = req.query.type;
    if (req.query.difficulty) filters.difficulty = req.query.difficulty;
    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Si l'utilisateur n'est pas admin/coach, ne montrer que les entraînements publics ou assignés
    if (req.user && req.user.role === "user") {
      filters.$or = [{ isPublic: true }, { assignedTo: req.user._id }];
    }

    const workouts = await Workout.find(filters)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Workout.countDocuments(filters);

    res.json({
      workouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des entraînements:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des entraînements",
    });
  }
};

// Obtenir un entraînement par ID
const getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName");

    if (!workout) {
      return res.status(404).json({
        error: "Entraînement non trouvé",
        message: "L'entraînement demandé n'existe pas",
      });
    }

    // Vérifier les permissions
    if (
      req.user &&
      req.user.role === "user" &&
      !workout.isPublic &&
      !workout.assignedTo.includes(req.user._id)
    ) {
      return res.status(403).json({
        error: "Accès refusé",
        message: "Vous n'avez pas accès à cet entraînement",
      });
    }

    res.json({ workout });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entraînement:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération de l'entraînement",
    });
  }
};

// Créer un nouvel entraînement
const createWorkout = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      difficulty,
      duration,
      exercises,
      isPublic,
      assignedTo,
      tags,
    } = req.body;

    // Les exercices sont maintenant intégrés directement dans le workout
    // Pas besoin de vérifier l'existence des exercices externes

    const workout = new Workout({
      name,
      description,
      type,
      difficulty,
      duration,
      exercises,
      isPublic: isPublic || false,
      assignedTo,
      tags,
      createdBy: req.user._id,
    });

    await workout.save();

    // Populate les relations pour la réponse
    await workout.populate("createdBy", "firstName lastName");
    await workout.populate("assignedTo", "firstName lastName");
    await workout.populate(
      "exercises.exercise",
      "name description category difficulty"
    );

    res.status(201).json({
      message: "Entraînement créé avec succès",
      workout,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'entraînement:", error);

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
      message:
        "Une erreur s'est produite lors de la création de l'entraînement",
    });
  }
};

// Mettre à jour un entraînement
const updateWorkout = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      difficulty,
      duration,
      exercises,
      isPublic,
      assignedTo,
      tags,
      isActive,
    } = req.body;

    const updateData = {
      name,
      description,
      type,
      difficulty,
      duration,
      exercises,
      isPublic,
      assignedTo,
      tags,
      isActive,
    };

    // Supprimer les champs undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Vérifier que tous les exercices existent si fournis
    if (exercises && exercises.length > 0) {
      const exerciseIds = exercises.map((ex) => ex.exercise);
      const existingExercises = await Exercise.find({
        _id: { $in: exerciseIds },
      });

      if (existingExercises.length !== exerciseIds.length) {
        return res.status(400).json({
          error: "Exercices invalides",
          message: "Certains exercices n'existent pas",
        });
      }
    }

    const workout = await Workout.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName");
    if (!workout) {
      return res.status(404).json({
        error: "Entraînement non trouvé",
        message: "L'entraînement demandé n'existe pas",
      });
    }

    res.json({
      message: "Entraînement mis à jour avec succès",
      workout,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entraînement:", error);

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
      message:
        "Une erreur s'est produite lors de la mise à jour de l'entraînement",
    });
  }
};

// Supprimer un entraînement
const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(req.params.id);

    if (!workout) {
      return res.status(404).json({
        error: "Entraînement non trouvé",
        message: "L'entraînement demandé n'existe pas",
      });
    }

    res.json({
      message: "Entraînement supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entraînement:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la suppression de l'entraînement",
    });
  }
};

// Obtenir les entraînements d'un utilisateur
const getUserWorkouts = async (req, res) => {
  try {
    const userId = req.params.userId || (req.user ? req.user._id : null);

    const workouts = await Workout.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      isActive: true,
    })
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")

      .sort({ createdAt: -1 });

    res.json({ workouts });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des entraînements de l'utilisateur:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des entraînements",
    });
  }
};

// Obtenir les entraînements par type
const getWorkoutsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const workouts = await Workout.find({
      type,
      isActive: true,
      $or: [
        { isPublic: true },
        ...(req.user
          ? [{ createdBy: req.user._id }, { assignedTo: req.user._id }]
          : []),
      ],
    })
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .sort({ name: 1 });

    res.json({ workouts });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des entraînements par type:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des entraînements",
    });
  }
};

// Obtenir les statistiques des entraînements
const getWorkoutStats = async (req, res) => {
  try {
    const totalWorkouts = await Workout.countDocuments();
    const activeWorkouts = await Workout.countDocuments({ isActive: true });
    const publicWorkouts = await Workout.countDocuments({ isPublic: true });

    const workoutsByType = await Workout.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const workoutsByDifficulty = await Workout.aggregate([
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentWorkouts = await Workout.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      stats: {
        total: totalWorkouts,
        active: activeWorkouts,
        public: publicWorkouts,
        recent: recentWorkouts,
        byType: workoutsByType,
        byDifficulty: workoutsByDifficulty,
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
  getAllWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getUserWorkouts,
  getWorkoutsByType,
  getWorkoutStats,
};
