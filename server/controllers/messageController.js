const db = require('../config/db');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

// Get all users you can chat with (Artists for Visitors/Collectors, and vice versa)
exports.getChatContacts = async (req, res) => {
  try {
    const userRole = req.user.role;
    let queryText = '';

    if (userRole === 'Artist') {
      // Artists see Visitors and Collectors
      queryText = `SELECT u.user_id, u.full_name, r.role_name 
                   FROM users u JOIN roles r ON u.role_id = r.role_id 
                   WHERE r.role_name IN ('Visitor', 'Art Collector') AND u.account_status = 'Active'`;
    } else {
      // Visitors/Collectors see Artists
      queryText = `SELECT u.user_id, u.full_name, r.role_name 
                   FROM users u JOIN roles r ON u.role_id = r.role_id 
                   WHERE r.role_name = 'Artist' AND u.account_status = 'Active'`;
    }

    const contacts = await query(queryText);
    res.json({ success: true, contacts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to load contacts.' });
  }
};

// Get chat history with a specific user
exports.getMessages = async (req, res) => {
  try {
    const myId = req.user.user_id;
    const otherId = req.params.userId;

    const messages = await query(
      `SELECT * FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?) 
       ORDER BY created_at ASC`,
      [myId, otherId, otherId, myId]
    );

    // Mark messages sent by the other user as read
    await query(
      `UPDATE messages SET is_read = 1 
       WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
      [otherId, myId]
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to load messages.' });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.user_id;
    const { receiver_id, message_text } = req.body;

    if (!message_text || !message_text.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    await query(
      `INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)`,
      [senderId, receiver_id, message_text.trim()]
    );

    res.status(201).json({ success: true, message: 'Message sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};