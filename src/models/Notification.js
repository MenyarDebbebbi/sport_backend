const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
	{
		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		type: {
			type: String,
			enum: [
				'info',
				'user_registered',
				'status_changed',
				'assigned_coach',
				'meal_action',
				'workout_action',
				'message',
			],
			default: 'info',
		},
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 150,
		},
		message: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000,
		},
		entity: {
			entityType: { type: String, default: null },
			entityId: { type: String, default: null },
			extra: { type: Object, default: {} },
		},
		isRead: {
			type: Boolean,
			default: false,
			index: true,
		},
		readAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	},
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
