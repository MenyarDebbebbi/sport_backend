const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Inscription d'un nouvel utilisateur
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      fitnessLevel,
      goals,
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

    // Créer le nouvel utilisateur
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      fitnessLevel,
      goals,
    });

    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      message: "Inscription réussie",
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);

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
      message: "Une erreur s'est produite lors de l'inscription",
    });
  }
};

// Connexion d'un utilisateur
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: "Identifiants invalides",
        message: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        error: "Compte désactivé",
        message: "Votre compte a été désactivé",
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Identifiants invalides",
        message: "Email ou mot de passe incorrect",
      });
    }

    // Générer le token
    const token = generateToken(user._id);

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: "Connexion réussie",
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la connexion",
    });
  }
};

// Obtenir le profil de l'utilisateur connecté
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.json({
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la récupération du profil",
    });
  }
};

// Mettre à jour le profil de l'utilisateur
const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      fitnessLevel,
      goals,
      profilePicture,
    } = req.body;

    const updateData = {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      fitnessLevel,
      goals,
      profilePicture,
    };

    // Supprimer les champs undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      message: "Profil mis à jour avec succès",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);

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
      message: "Une erreur s'est produite lors de la mise à jour du profil",
    });
  }
};

// Changer le mot de passe
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: "Mot de passe incorrect",
        message: "L'ancien mot de passe est incorrect",
      });
    }

    // Mettre à jour le nouveau mot de passe
    user.password = newPassword;
    await user.save();

    res.json({
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Mot de passe invalide",
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères",
      });
    }

    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors du changement de mot de passe",
    });
  }
};

// Déconnexion (côté client, mais on peut invalider le token côté serveur si nécessaire)
const logout = async (req, res) => {
  try {
    // Optionnel : ajouter le token à une liste noire
    // Pour l'instant, on retourne juste un message de succès
    res.json({
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors de la déconnexion",
    });
  }
};

// Rafraîchir le token
const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Token invalide",
        message: "Utilisateur non trouvé ou compte désactivé",
      });
    }

    const newToken = generateToken(user._id);

    res.json({
      message: "Token rafraîchi avec succès",
      token: newToken,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur s'est produite lors du rafraîchissement du token",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
};
