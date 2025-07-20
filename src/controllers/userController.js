const User = require("../models/User");

// Obtenir tous les utilisateurs (avec pagination et filtres)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtres
    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.search) {
      filters.$or = [
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
        { username: { $regex: req.query.search, $options: "i" } },
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
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur demandé n'existe pas",
      });
    }

    res.json({
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
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
