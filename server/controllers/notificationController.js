
const db = require('../config/db');

// Get all notifications belonging to the logged-in user
const getMyNotifications = (req, res) => {
  const user_id = req.user.user_id;

  const query = `
    SELECT notification_id, title, message, notification_type, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [user_id], (error, results) => {
    if (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications.'
      });
    }

    return res.status(200).json({
      success: true,
      notifications: results
    });
  });
};

// Get unread notification count
const getUnreadCount = (req, res) => {
  const user_id = req.user.user_id;

  const query = `
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE user_id = ? AND is_read = 0
  `;

  db.query(query, [user_id], (error, results) => {
    if (error) {
      console.error('Unread notification count error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve unread notification count.'
      });
    }

    return res.status(200).json({
      success: true,
      unread_count: results[0].unread_count
    });
  });
};

// Mark one notification as read
const markNotificationAsRead = (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params;

  const query = `
    UPDATE notifications
    SET is_read = 1
    WHERE notification_id = ? AND user_id = ?
  `;

  db.query(query, [id, user_id], (error, result) => {
    if (error) {
      console.error('Mark notification as read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update notification.'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  });
};

// Mark all notifications as read
const markAllNotificationsAsRead = (req, res) => {
  const user_id = req.user.user_id;

  const query = `
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ? AND is_read = 0
  `;

  db.query(query, [user_id], (error, result) => {
    if (error) {
      console.error('Mark all notifications as read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update notifications.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      updated_count: result.affectedRows
    });
  });
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
