const IQuestion = require("../models/IQuestion");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Obtenir toutes les questions d'un utilisateur
const getUserQuestions = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur demandé n'existe pas",
      });
    }

    // Vérifier les permissions (utilisateur peut voir ses propres questions, coach/admin peuvent voir toutes)
    if (
      req.user._id.toString() !== userId.toString() &&
      !["coach", "admin"].includes(req.user.role)
    ) {
      return res.status(403).json({
        error: "Permission refusée",
        message: "Vous ne pouvez pas accéder aux questions de cet utilisateur",
      });
    }

    // Si c'est un coach qui accède à ses propres questions, permettre l'accès
    if (
      req.user.role === "coach" &&
      req.user._id.toString() === userId.toString()
    ) {
      // Permettre l'accès
    } else if (
      req.user._id.toString() !== userId.toString() &&
      !["admin"].includes(req.user.role)
    ) {
      // Pour les coachs qui accèdent aux questions d'autres utilisateurs, vérifier qu'ils sont assignés
      if (req.user.role === "coach") {
        // Vérifier si le coach est assigné à cet utilisateur
        if (
          !user.assignedCoach ||
          user.assignedCoach.toString() !== req.user._id.toString()
        ) {
          return res.status(403).json({
            error: "Permission refusée",
            message:
              "Vous ne pouvez accéder qu'aux questions des utilisateurs qui vous sont assignés",
          });
        }
      }
    }

    let questions = await IQuestion.findOne({ userId }).populate(
      "userId",
      "firstName lastName email"
    );

    // Si aucune question n'existe, créer un document vide
    if (!questions) {
      questions = new IQuestion({ userId });
      await questions.save();
    }

    res.json({
      questions,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des questions:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "ID invalide",
        message: "L'ID de l'utilisateur n'est pas valide",
      });
    }

    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des questions",
    });
  }
};

// Créer ou mettre à jour les questions d'un utilisateur
const createOrUpdateQuestions = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur demandé n'existe pas",
      });
    }

    // Vérifier les permissions
    if (
      req.user._id.toString() !== userId.toString() &&
      !["coach", "admin"].includes(req.user.role)
    ) {
      return res.status(403).json({
        error: "Permission refusée",
        message: "Vous ne pouvez pas modifier les questions de cet utilisateur",
      });
    }

    // Si c'est un coach qui modifie ses propres questions, permettre l'accès
    if (
      req.user.role === "coach" &&
      req.user._id.toString() === userId.toString()
    ) {
      // Permettre l'accès
    } else if (
      req.user._id.toString() !== userId.toString() &&
      !["admin"].includes(req.user.role)
    ) {
      // Pour les coachs qui modifient les questions d'autres utilisateurs, vérifier qu'ils sont assignés
      if (req.user.role === "coach") {
        // Vérifier si le coach est assigné à cet utilisateur
        if (
          !user.assignedCoach ||
          user.assignedCoach.toString() !== req.user._id.toString()
        ) {
          return res.status(403).json({
            error: "Permission refusée",
            message:
              "Vous ne pouvez modifier que les questions des utilisateurs qui vous sont assignés",
          });
        }
      }
    }

    const {
      bloodPressure,
      restingHeartRate,
      cardioTest,
      pushupsPerMinute,
      situpsPerMinute,
      stretching,
      bodyFatPercentage,
      bodyWeight,
      heartProblems,
      chestPainDuringExercise,
      chestPainLastMonth,
      dizzinessOrFainting,
      jointProblems,
      bloodPressureOrHeartMedication,
      type1Diabetes,
      otherExerciseRestrictions,
      hasAllergies,
      allergiesDetails,
    } = req.body;

    // Chercher si des questions existent déjà
    let questions = await IQuestion.findOne({ userId });

    if (questions) {
      // Mettre à jour les questions existantes
      const updateData = {
        bloodPressure,
        restingHeartRate,
        cardioTest,
        pushupsPerMinute,
        situpsPerMinute,
        stretching,
        bodyFatPercentage,
        bodyWeight,
        heartProblems,
        chestPainDuringExercise,
        chestPainLastMonth,
        dizzinessOrFainting,
        jointProblems,
        bloodPressureOrHeartMedication,
        type1Diabetes,
        otherExerciseRestrictions,
        hasAllergies,
        allergiesDetails,
      };

      // Supprimer les champs undefined
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      questions = await IQuestion.findByIdAndUpdate(questions._id, updateData, {
        new: true,
        runValidators: true,
      }).populate("userId", "firstName lastName email");
    } else {
      // Créer de nouvelles questions
      questions = new IQuestion({
        userId,
        bloodPressure,
        restingHeartRate,
        cardioTest,
        pushupsPerMinute,
        situpsPerMinute,
        stretching,
        bodyFatPercentage,
        bodyWeight,
        heartProblems,
        chestPainDuringExercise,
        chestPainLastMonth,
        dizzinessOrFainting,
        jointProblems,
        bloodPressureOrHeartMedication,
        type1Diabetes,
        otherExerciseRestrictions,
        hasAllergies,
        allergiesDetails,
      });

      await questions.save();
      await questions.populate("userId", "firstName lastName email");
    }

    // Envoyer une notification au coach si l'utilisateur a un coach assigné
    try {
      if (user.assignedCoach) {
        await Notification.create({
          recipient: user.assignedCoach,
          sender: req.user._id,
          type: "health_questions_updated",
          title: "Questions de santé mises à jour",
          message: `${user.firstName} ${user.lastName} a mis à jour ses questions de santé`,
          entity: { entityType: "IQuestion", entityId: String(questions._id) },
        });
      }
    } catch (e) {
      console.warn(
        "Notification (createOrUpdateQuestions) failed:",
        e?.message
      );
    }

    res.json({
      message: "Questions sauvegardées avec succès",
      questions,
      recommendations: questions.getRecommendations(),
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des questions:", error);

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

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "ID invalide",
        message: "L'ID de l'utilisateur n'est pas valide",
      });
    }

    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la sauvegarde des questions",
    });
  }
};

// Obtenir toutes les questions (pour les coachs/admins)
const getAllQuestions = async (req, res) => {
  try {
    // Vérifier les permissions
    if (!["coach", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Permission refusée",
        message:
          "Seuls les coachs et administrateurs peuvent accéder à cette fonctionnalité",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtres
    const filters = {};
    if (req.query.riskLevel) {
      if (!["low", "moderate", "high"].includes(req.query.riskLevel)) {
        return res.status(400).json({
          error: "Paramètre invalide",
          message: "Le niveau de risque doit être low, moderate ou high",
        });
      }
      filters.riskLevel = req.query.riskLevel;
    }

    if (req.query.isComplete !== undefined) {
      filters.isComplete = req.query.isComplete === "true";
    }

    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      if (searchTerm.length < 2) {
        return res.status(400).json({
          error: "Paramètre invalide",
          message: "Le terme de recherche doit contenir au moins 2 caractères",
        });
      }

      // Rechercher par nom d'utilisateur
      const users = await User.find({
        $or: [
          { firstName: { $regex: searchTerm, $options: "i" } },
          { lastName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((user) => user._id);
      filters.userId = { $in: userIds };
    }

    const questions = await IQuestion.find(filters)
      .populate("userId", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await IQuestion.countDocuments(filters);

    res.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des questions:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des questions",
    });
  }
};

// Obtenir les statistiques des questions
const getQuestionsStats = async (req, res) => {
  try {
    // Vérifier les permissions
    if (!["coach", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Permission refusée",
        message:
          "Seuls les coachs et administrateurs peuvent accéder à cette fonctionnalité",
      });
    }

    const totalQuestions = await IQuestion.countDocuments();
    const completeQuestions = await IQuestion.countDocuments({
      isComplete: true,
    });
    const incompleteQuestions = await IQuestion.countDocuments({
      isComplete: false,
    });

    const questionsByRiskLevel = await IQuestion.aggregate([
      {
        $group: {
          _id: "$riskLevel",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentQuestions = await IQuestion.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const averageRiskScore = await IQuestion.aggregate([
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$riskScore" },
        },
      },
    ]);

    res.json({
      stats: {
        total: totalQuestions,
        complete: completeQuestions,
        incomplete: incompleteQuestions,
        recent: recentQuestions,
        byRiskLevel: questionsByRiskLevel,
        averageRiskScore: averageRiskScore[0]?.averageScore || 0,
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

// Supprimer les questions d'un utilisateur
const deleteUserQuestions = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Vérifier les permissions (seuls les admins peuvent supprimer)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Permission refusée",
        message: "Seuls les administrateurs peuvent supprimer les questions",
      });
    }

    const questions = await IQuestion.findOneAndDelete({ userId });

    if (!questions) {
      return res.status(404).json({
        error: "Questions non trouvées",
        message: "Aucune question trouvée pour cet utilisateur",
      });
    }

    res.json({
      message: "Questions supprimées avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des questions:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "ID invalide",
        message: "L'ID de l'utilisateur n'est pas valide",
      });
    }

    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la suppression des questions",
    });
  }
};

// Obtenir les recommandations pour un utilisateur
const getUserRecommendations = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Vérifier les permissions
    if (
      req.user._id.toString() !== userId.toString() &&
      !["coach", "admin"].includes(req.user.role)
    ) {
      return res.status(403).json({
        error: "Permission refusée",
        message:
          "Vous ne pouvez pas accéder aux recommandations de cet utilisateur",
      });
    }

    // Si c'est un coach qui accède à ses propres recommandations, permettre l'accès
    if (
      req.user.role === "coach" &&
      req.user._id.toString() === userId.toString()
    ) {
      // Permettre l'accès
    } else if (
      req.user._id.toString() !== userId.toString() &&
      !["admin"].includes(req.user.role)
    ) {
      // Pour les coachs qui accèdent aux recommandations d'autres utilisateurs, vérifier qu'ils sont assignés
      if (req.user.role === "coach") {
        // Vérifier si le coach est assigné à cet utilisateur
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            error: "Utilisateur non trouvé",
            message: "L'utilisateur demandé n'existe pas",
          });
        }
        if (
          !user.assignedCoach ||
          user.assignedCoach.toString() !== req.user._id.toString()
        ) {
          return res.status(403).json({
            error: "Permission refusée",
            message:
              "Vous ne pouvez accéder qu'aux recommandations des utilisateurs qui vous sont assignés",
          });
        }
      }
    }

    const questions = await IQuestion.findOne({ userId });

    if (!questions) {
      return res.status(404).json({
        error: "Questions non trouvées",
        message: "Aucune question trouvée pour cet utilisateur",
      });
    }

    const recommendations = questions.getRecommendations();

    res.json({
      recommendations,
      riskLevel: questions.riskLevel,
      riskScore: questions.riskScore,
      isComplete: questions.isComplete,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des recommandations:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "ID invalide",
        message: "L'ID de l'utilisateur n'est pas valide",
      });
    }

    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des recommandations",
    });
  }
};

module.exports = {
  getUserQuestions,
  createOrUpdateQuestions,
  getAllQuestions,
  getQuestionsStats,
  deleteUserQuestions,
  getUserRecommendations,
};
