const Session = require("../models/Session");
const Workout = require("../models/Workout");
const Notification = require("../models/Notification");

const getAllSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      difficulty,
      isPublic,
      search,
    } = req.query;
    const skip = (page - 1) * limit;

    // Seules les séances publiques, créées par l'utilisateur ou assignées à l'utilisateur
    const filter = {
      isActive: true,
      $or: [
        { isPublic: true },
        { createdBy: req.user.id },
        { assignedTo: req.user.id },
      ],
    };

    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (isPublic !== undefined) filter.isPublic = isPublic === "true";
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    const sessions = await Session.find(filter)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("exercises")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(filter);

    res.json({
      sessions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des sessions:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des sessions",
      error: error.message,
    });
  }
};

const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("exercises");

    if (!session) {
      return res.status(404).json({
        message: "Session non trouvée",
      });
    }

    res.json(session);
  } catch (error) {
    console.error("Erreur lors de la récupération de la session:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération de la session",
      error: error.message,
    });
  }
};

const createSession = async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      type,
      difficulty,
      isPublic,
      assignedTo,
      tags,
    } = req.body;

    const session = new Session({
      name,
      description,
      duration,
      type,
      difficulty,
      isPublic: isPublic || false,
      assignedTo,
      tags,
      createdBy: req.user._id,
    });

    await session.save();

    await session.populate("createdBy", "firstName lastName");
    await session.populate("assignedTo", "firstName lastName");

    try {
      if (Array.isArray(session.assignedTo) && session.assignedTo.length > 0) {
        const notifications = session.assignedTo.map((uid) => ({
          recipient: uid,
          sender: req.user?._id || null,
          type: "session_assigned",
          title: "Nouvelle séance attribuée",
          message: `Votre coach a ajouté une séance: ${session.name}`,
          entity: {
            entityType: "session",
            entityId: String(session._id),
            extra: { type: session.type },
          },
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifyErr) {
      console.error("Erreur création notification (session):", notifyErr);
    }

    res.status(201).json({
      message: "Session créée avec succès",
      session,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la session:", error);
    res.status(500).json({
      message: "Erreur lors de la création de la session",
      error: error.message,
    });
  }
};

const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        message: "Session non trouvée",
      });
    }

    if (
      session.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "coach"
    ) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier cette session",
      });
    }

    const updatedSession = await Session.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("exercises");

    res.json({
      message: "Session mise à jour avec succès",
      session: updatedSession,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la session:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour de la session",
      error: error.message,
    });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        message: "Session non trouvée",
      });
    }

    if (
      session.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "coach"
    ) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à supprimer cette session",
      });
    }

    // Supprimer tous les exercices (workouts) associés à cette séance
    await Workout.deleteMany({ sessionId: id });

    await Session.findByIdAndDelete(id);

    res.json({
      message: "Session supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la session:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression de la session",
      error: error.message,
    });
  }
};

const getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      isActive: true,
    };

    const sessions = await Session.find(filter)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("exercises")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(filter);

    res.json({
      sessions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des sessions utilisateur:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des sessions utilisateur",
      error: error.message,
    });
  }
};

const getSessionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { type, isActive: true, isPublic: true };

    const sessions = await Session.find(filter)
      .populate("createdBy", "firstName lastName")
      .populate("exercises")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(filter);

    res.json({
      sessions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des sessions par type:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des sessions par type",
      error: error.message,
    });
  }
};

const getSessionStats = async (req, res) => {
  try {
    const sessions = await Session.find({
      isActive: true,
      createdBy: req.user._id,
    });

    const totalSessions = sessions.length;
    const totalExercises = await Workout.countDocuments({
      sessionId: { $in: sessions.map((s) => s._id) },
    });
    const avgDuration =
      sessions.reduce((acc, session) => acc + (session.duration || 0), 0) /
        totalSessions || 0;

    const byType = sessions.reduce((acc, session) => {
      acc[session.type] = (acc[session.type] || 0) + 1;
      return acc;
    }, {});

    const byDifficulty = sessions.reduce((acc, session) => {
      acc[session.difficulty] = (acc[session.difficulty] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalSessions,
      totalExercises,
      avgDuration,
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      byDifficulty: Object.entries(byDifficulty).map(([difficulty, count]) => ({
        difficulty,
        count,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};

const addExerciseToSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const exerciseData = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        message: "Session non trouvée",
      });
    }

    if (
      session.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "coach"
    ) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier cette session",
      });
    }

    // Déterminer l'ordre du nouvel exercice
    const existingExercises = await Workout.find({ sessionId }).sort({
      order: -1,
    });
    const nextOrder =
      existingExercises.length > 0 ? existingExercises[0].order + 1 : 1;

    // Créer le nouvel exercice/workout avec sessionId
    const workout = new Workout({
      ...exerciseData,
      sessionId,
      order: nextOrder,
      createdBy: req.user._id,
    });

    await workout.save();

    // Récupérer la session mise à jour avec les exercices
    const updatedSession = await Session.findById(sessionId)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("exercises");

    res.json({
      message: "Exercice ajouté à la session avec succès",
      session: updatedSession,
      exercise: workout,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'exercice à la session:", error);
    res.status(500).json({
      message: "Erreur lors de l'ajout de l'exercice à la session",
      error: error.message,
    });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getUserSessions,
  getSessionsByType,
  getSessionStats,
  addExerciseToSession,
};
