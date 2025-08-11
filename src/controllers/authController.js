const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Générer un token JWT
const generateToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN || '7d',
	});
};

// Inscription d'un nouvel utilisateur
const register = async (req, res) => {
	try {
		const {
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
			pack,
		} = req.body;

		const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}-${Math.random()
			.toString(36)
			.substring(2, 15)}`;

		// Vérifier si l'utilisateur existe déjà
		const existingUser = await User.findOne({
			$or: [{ email }, { username }],
		});

		if (existingUser) {
			return res.status(400).json({
				error: 'Utilisateur déjà existant',
				message:
					existingUser.email === email
						? 'Un utilisateur avec cet email existe déjà'
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
			// Pack optionnel
			...(pack
				? {
						pack: {
							id: pack.packId || pack.id || null,
							title: pack.packTitle || pack.title || null,
							level: pack.levelId || pack.level || null,
							price: pack.price ?? null,
							duration: pack.duration || null,
							selectedAt: new Date(),
						},
				  }
				: {}),
		});

		await user.save();

		// Générer le token
		const token = generateToken(user._id);

		// Mettre à jour la dernière connexion
		user.lastLogin = new Date();
		await user.save();

		// Notifier tous les coachs qu'un nouvel utilisateur s'est inscrit (statut pending)
		try {
			const coaches = await User.find({ role: 'coach', isActive: true }).select('_id');
			if (coaches.length > 0) {
				const notifications = coaches.map((c) => ({
					recipient: c._id,
					sender: user._id,
					type: 'user_registered',
					title: 'Nouvelle inscription',
					message:
						user.pack && user.pack.title
							? `${user.firstName} ${user.lastName} s'est inscrit (pack: ${user.pack.title} - ${user.pack.level}) et est en attente d'activation`
							: `${user.firstName} ${user.lastName} s'est inscrit et est en attente d'activation`,
					entity: {
						entityType: 'User',
						entityId: String(user._id),
						extra: user.pack
							? { pack: { title: user.pack.title, level: user.pack.level, price: user.pack.price } }
							: {},
					},
				}));
				await Notification.insertMany(notifications);
			}
		} catch (e) {
			console.warn('Notification (register) failed:', e?.message);
		}

		res.status(201).json({
			status: 'success',
			message: 'Inscription réussie',
			token,
			user: user.toPublicJSON(),
		});
	} catch (error) {
		console.error("Erreur lors de l'inscription:", error);

		if (error.name === 'ValidationError') {
			const errors = Object.values(error.errors).map((err) => ({
				field: err.path,
				message: err.message,
			}));

			return res.status(400).json({
				status: 'error',
				error: 'Données invalides',
				message: 'Veuillez corriger les erreurs suivantes',
				errors,
			});
		}

		res.status(500).json({
			status: 'error',
			error: 'Erreur serveur',
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
				status: 'error',
				error: 'Identifiants invalides',
				message: 'Email ou mot de passe incorrect',
			});
		}

		// Vérifier si le compte est actif
		if (!user.isActive) {
			return res.status(401).json({
				status: 'error',
				error: 'Compte désactivé',
				message: 'Votre compte a été désactivé',
			});
		}

		// Vérifier le mot de passe
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			return res.status(401).json({
				status: 'error',
				error: 'Identifiants invalides',
				message: 'Email ou mot de passe incorrect',
			});
		}

		// Générer le token
		const token = generateToken(user._id);

		// Mettre à jour la dernière connexion
		user.lastLogin = new Date();
		await user.save();

		res.json({
			status: 'success',
			message: 'Connexion réussie',
			token,
		});
	} catch (error) {
		console.error('Erreur lors de la connexion:', error);
		res.status(500).json({
			status: 'error',
			error: 'Erreur serveur',
			message: "Une erreur s'est produite lors de la connexion",
		});
	}
};

// Obtenir le profil de l'utilisateur connecté
const getMe = async (req, res) => {
	try {
		const { authorization } = req.headers;
		const token = authorization.split(' ')[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.userId).select('-password');

		res.json({
			status: 'success',
			user: user.toPublicJSON(),
		});
	} catch (error) {
		console.error('Erreur lors de la récupération du profil:', error);
		res.status(500).json({
			status: 'error',
			error: 'Erreur serveur',
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
			(key) => updateData[key] === undefined && delete updateData[key],
		);

		const user = await User.findByIdAndUpdate(req.user._id, updateData, {
			new: true,
			runValidators: true,
		}).select('-password');

		res.json({
			message: 'Profil mis à jour avec succès',
			user: user.toPublicJSON(),
		});
	} catch (error) {
		console.error('Erreur lors de la mise à jour du profil:', error);

		if (error.name === 'ValidationError') {
			const errors = Object.values(error.errors).map((err) => ({
				field: err.path,
				message: err.message,
			}));

			return res.status(400).json({
				error: 'Données invalides',
				message: 'Veuillez corriger les erreurs suivantes',
				errors,
			});
		}

		res.status(500).json({
			error: 'Erreur serveur',
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
				error: 'Mot de passe incorrect',
				message: "L'ancien mot de passe est incorrect",
			});
		}

		// Mettre à jour le nouveau mot de passe
		user.password = newPassword;
		await user.save();

		res.json({
			message: 'Mot de passe modifié avec succès',
		});
	} catch (error) {
		console.error('Erreur lors du changement de mot de passe:', error);

		if (error.name === 'ValidationError') {
			return res.status(400).json({
				error: 'Mot de passe invalide',
				message: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
			});
		}

		res.status(500).json({
			error: 'Erreur serveur',
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
			message: 'Déconnexion réussie',
		});
	} catch (error) {
		console.error('Erreur lors de la déconnexion:', error);
		res.status(500).json({
			error: 'Erreur serveur',
			message: "Une erreur s'est produite lors de la déconnexion",
		});
	}
};

// Rafraîchir le token
const refreshToken = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select('-password');

		if (!user || !user.isActive) {
			return res.status(401).json({
				status: 'error',
				error: 'Token invalide',
				message: 'Utilisateur non trouvé ou compte désactivé',
			});
		}

		const newToken = generateToken(user._id);

		res.json({
			status: 'success',
			message: 'Token rafraîchi avec succès',
			token: newToken,
		});
	} catch (error) {
		console.error('Erreur lors du rafraîchissement du token:', error);
		res.status(500).json({
			status: 'error',
			error: 'Erreur serveur',
			message: "Une erreur s'est produite lors du rafraîchissement du token",
		});
	}
};

module.exports = {
	register,
	login,
	getMe,
	updateProfile,
	changePassword,
	logout,
	refreshToken,
};
