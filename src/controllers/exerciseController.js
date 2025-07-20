const Exercise = require("../models/Exercise");

// Obtenir tous les exercices (avec pagination et filtres)
const getAllExercises = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtres
    const filters = { isActive: true };
    if (req.query.category) filters.category = req.query.category;
    if (req.query.difficulty) filters.difficulty = req.query.difficulty;
    if (req.query.muscleGroups) {
      filters.muscleGroups = { $in: req.query.muscleGroups.split(",") };
    }
    if (req.query.equipment) {
      filters.equipment = { $in: req.query.equipment.split(",") };
    }
    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const exercises = await Exercise.find(filters)
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Exercise.countDocuments(filters);

    res.json({
      exercises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des exercices:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des exercices",
    });
  }
};

// Obtenir un exercice par ID
const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName"
    );

    if (!exercise) {
      return res.status(404).json({
        error: "Exercice non trouvé",
        message: "L'exercice demandé n'existe pas",
      });
    }

    res.json({ exercise });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'exercice:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération de l'exercice",
    });
  }
};

// Créer un nouvel exercice
const createExercise = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      muscleGroups,
      difficulty,
      equipment,
      instructions,
      tips,
      videoUrl,
      imageUrl,
      duration,
      calories,
    } = req.body;

    const exercise = new Exercise({
      name,
      description,
      category,
      muscleGroups,
      difficulty,
      equipment,
      instructions,
      tips,
      videoUrl,
      imageUrl,
      duration,
      calories,
      createdBy: req.user._id,
    });

    await exercise.save();

    res.status(201).json({
      message: "Exercice créé avec succès",
      exercise,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'exercice:", error);

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
      message: "Une erreur s'est produite lors de la création de l'exercice",
    });
  }
};

// Mettre à jour un exercice
const updateExercise = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      muscleGroups,
      difficulty,
      equipment,
      instructions,
      tips,
      videoUrl,
      imageUrl,
      duration,
      calories,
      isActive,
    } = req.body;

    const updateData = {
      name,
      description,
      category,
      muscleGroups,
      difficulty,
      equipment,
      instructions,
      tips,
      videoUrl,
      imageUrl,
      duration,
      calories,
      isActive,
    };

    // Supprimer les champs undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName");

    if (!exercise) {
      return res.status(404).json({
        error: "Exercice non trouvé",
        message: "L'exercice demandé n'existe pas",
      });
    }

    res.json({
      message: "Exercice mis à jour avec succès",
      exercise,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'exercice:", error);

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
      message: "Une erreur s'est produite lors de la mise à jour de l'exercice",
    });
  }
};

// Supprimer un exercice
const deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        error: "Exercice non trouvé",
        message: "L'exercice demandé n'existe pas",
      });
    }

    res.json({
      message: "Exercice supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'exercice:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la suppression de l'exercice",
    });
  }
};

// Obtenir les exercices par catégorie
const getExercisesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const exercises = await Exercise.find({
      category,
      isActive: true,
    })
      .populate("createdBy", "firstName lastName")
      .sort({ name: 1 });

    res.json({ exercises });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des exercices par catégorie:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des exercices",
    });
  }
};

// Obtenir les exercices par groupe musculaire
const getExercisesByMuscleGroup = async (req, res) => {
  try {
    const { muscleGroup } = req.params;
    const exercises = await Exercise.find({
      muscleGroups: muscleGroup,
      isActive: true,
    })
      .populate("createdBy", "firstName lastName")
      .sort({ name: 1 });

    res.json({ exercises });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des exercices par groupe musculaire:",
      error
    );
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des exercices",
    });
  }
};

// Obtenir les statistiques des exercices
const getExerciseStats = async (req, res) => {
  try {
    const totalExercises = await Exercise.countDocuments();
    const activeExercises = await Exercise.countDocuments({ isActive: true });

    const exercisesByCategory = await Exercise.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const exercisesByDifficulty = await Exercise.aggregate([
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentExercises = await Exercise.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      stats: {
        total: totalExercises,
        active: activeExercises,
        recent: recentExercises,
        byCategory: exercisesByCategory,
        byDifficulty: exercisesByDifficulty,
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
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  getExercisesByCategory,
  getExercisesByMuscleGroup,
  getExerciseStats,
};
