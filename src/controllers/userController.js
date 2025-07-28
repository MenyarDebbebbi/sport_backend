const User = require("../models/User");

// Obtenir tous les utilisateurs (avec pagination et filtres) - SANS AUTHENTIFICATION
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validation des paramètres
    if (page < 1) {
      return res.status(400).json({
        error: "Paramètre invalide",
        message: "Le numéro de page doit être supérieur à 0",
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Paramètre invalide",
        message: "La limite doit être comprise entre 1 et 100",
      });
    }

    // Filtres
    const filters = {};
    if (req.query.role) {
      if (!["user", "coach", "admin"].includes(req.query.role)) {
        return res.status(400).json({
          error: "Paramètre invalide",
          message: "Le rôle doit être user, coach ou admin",
        });
      }
      filters.role = req.query.role;
    }

    if (req.query.status) {
      if (!["active", "pending", "inactive"].includes(req.query.status)) {
        return res.status(400).json({
          error: "Paramètre invalide",
          message: "Le statut doit être active, pending ou inactive",
        });
      }
      filters.status = req.query.status;
    }

    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      if (searchTerm.length < 2) {
        return res.status(400).json({
          error: "Paramètre invalide",
          message: "Le terme de recherche doit contenir au moins 2 caractères",
        });
      }
      filters.$or = [
        { firstName: { $regex: searchTerm, $options: "i" } },
        { lastName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { username: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const users = await User.find(filters)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("assignedCoach", "firstName lastName email");

    const total = await User.countDocuments(filters);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération des utilisateurs",
    });
  }
};

// Obtenir un utilisateur par ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("assignedCoach", "firstName lastName email");

    if (!user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur demandé n'existe pas",
      });
    }

    res.json({ user });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "ID invalide",
        message: "L'ID de l'utilisateur n'est pas valide",
      });
    }

    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la récupération de l'utilisateur",
    });
  }
};

// Créer un nouvel utilisateur (par un admin/coach)
const createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      city,
      height,
      weight,
      healthInfo,
      fitnessLevel,
      goals,
      role,
      assignedCoach,
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Utilisateur déjà existant",
        message:
          existingUser.email === email
            ? "Un utilisateur avec cet email existe déjà"
            : "Ce nom d'utilisateur est déjà pris",
      });
    }

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      city,
      height,
      weight,
      healthInfo,
      fitnessLevel,
      goals,
      role: role || "user",
      assignedCoach,
      status: "pending",
    });

    await user.save();

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);

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
      message: "Une erreur s'est produite lors de la création de l'utilisateur",
    });
  }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      city,
      height,
      weight,
      healthInfo,
      fitnessLevel,
      goals,
      role,
      status,
      assignedCoach,
    } = req.body;

    const updateData = {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      city,
      height,
      weight,
      healthInfo,
      fitnessLevel,
      goals,
      role,
      status,
      assignedCoach,
    };

    // Supprimer les champs undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("assignedCoach", "firstName lastName email");

    if (!user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur demandé n'existe pas",
      });
    }

    res.json({
      message: "Utilisateur mis à jour avec succès",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);

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
        "Une erreur s'est produite lors de la mise à jour de l'utilisateur",
    });
  }
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  try {
    // Empêcher l'utilisateur de se supprimer lui-même
    if (req.params.id === req.user.userId) {
      return res.status(400).json({
        error: "Action non autorisée",
        message: "Vous ne pouvez pas supprimer votre propre compte",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur demandé n'existe pas",
      });
    }

    // Empêcher la suppression d'un admin par un non-admin
    if (user.role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Permission refusée",
        message:
          "Seuls les administrateurs peuvent supprimer d'autres administrateurs",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "ID invalide",
        message: "L'ID de l'utilisateur n'est pas valide",
      });
    }

    res.status(500).json({
      error: "Erreur serveur",
      message:
        "Une erreur s'est produite lors de la suppression de l'utilisateur",
    });
  }
};

// Obtenir les statistiques des utilisateurs
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });
    const pendingUsers = await User.countDocuments({ status: "pending" });
    const inactiveUsers = await User.countDocuments({ status: "inactive" });

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      stats: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        inactive: inactiveUsers,
        recent: recentUsers,
        byRole: usersByRole,
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

// Obtenir les coachs disponibles
const getCoaches = async (req, res) => {
  try {
    const coaches = await User.find({
      role: "coach",
      status: "active",
      isActive: true,
    })
      .select("firstName lastName email profilePicture")
      .sort({ firstName: 1 });

    res.json({ coaches });
  } catch (error) {
    console.error("Erreur lors de la récupération des coachs:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la récupération des coachs",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getCoaches,
};
