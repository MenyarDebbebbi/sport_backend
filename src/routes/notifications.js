const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const {
	getMyNotifications,
	markAsRead,
	markAllAsRead,
	getMyUnreadCount,
} = require('../controllers/notificationController');
const { validateObjectId } = require('../middleware/validation');

router.get('/', authenticateToken, getMyNotifications);
router.get('/unread-count', authenticateToken, getMyUnreadCount);
router.post('/mark-all-read', authenticateToken, markAllAsRead);
router.post('/:id/read', authenticateToken, validateObjectId('id'), markAsRead);

module.exports = router;
