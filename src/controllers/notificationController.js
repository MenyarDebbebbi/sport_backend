const Notification = require('../models/Notification');

// List notifications for current user
const getMyNotifications = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const filters = { recipient: req.user._id };
		if (req.query.isRead === 'true') filters.isRead = true;
		if (req.query.isRead === 'false') filters.isRead = false;

		const [items, total] = await Promise.all([
			Notification.find(filters)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate('sender', 'firstName lastName role'),
			Notification.countDocuments(filters),
		]);

		res.json({
			notifications: items,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error('Erreur lors de la récupération des notifications:', error);
		res.status(500).json({
			error: 'Erreur serveur',
			message: 'Impossible de récupérer les notifications',
		});
	}
};

// Mark a notification as read
const markAsRead = async (req, res) => {
	try {
		const notif = await Notification.findOne({
			_id: req.params.id,
			recipient: req.user._id,
		});
		if (!notif) {
			return res.status(404).json({ error: 'Notification non trouvée' });
		}
		if (!notif.isRead) {
			notif.isRead = true;
			notif.readAt = new Date();
			await notif.save();
		}
		res.json({ message: 'Notification lue', notification: notif });
	} catch (error) {
		console.error('Erreur lors de la mise à jour de la notification:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};

// Mark all as read
const markAllAsRead = async (req, res) => {
	try {
		await Notification.updateMany(
			{ recipient: req.user._id, isRead: false },
			{ $set: { isRead: true, readAt: new Date() } },
		);
		res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
	} catch (error) {
		console.error('Erreur lors du marquage des notifications:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};

// Admin/coach: get unread count for own account
const getMyUnreadCount = async (req, res) => {
	try {
		const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
		res.json({ count });
	} catch (error) {
		console.error('Erreur lors du comptage des notifications:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};

module.exports = {
	getMyNotifications,
	markAsRead,
	markAllAsRead,
	getMyUnreadCount,
};
