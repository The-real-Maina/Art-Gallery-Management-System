const db = require('../config/db');

/**
 * Fire-and-forget notification helper.
 * Never throws — logs errors so they don't break the main request.
 *
 * @param {number} userId - Recipient user_id
 * @param {string} title  - Short title (e.g. "Booking confirmed")
 * @param {string} message - Full message body
 * @param {string} type   - 'booking' | 'artwork' | 'inquiry' | 'tour' | 'system'
 */
const notify = (userId, title, message, type = 'system') => {
  if (!userId) return;

  db.query(
    `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
     VALUES (?, ?, ?, ?, 0)`,
    [userId, title, message, type],
    (error) => {
      if (error) {
        console.error('Notification insert failed:', error);
      }
    }
  );
};

module.exports = { notify };