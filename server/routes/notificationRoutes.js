
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

// Get notifications
router.get('/', getMyNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark all notifications as read
router.patch('/mark-all-read', markAllNotificationsAsRead);

// Mark one notification as read
router.patch('/:id/read', markNotificationAsRead);

module.exports = router;
