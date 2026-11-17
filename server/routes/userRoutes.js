const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// GET LOGGED-IN USER PROFILE
router.get('/profile', protect, (req, res) => {
  db.query(
    `SELECT
       users.user_id,
       users.full_name,
       users.email,
       roles.role_name
     FROM users
     INNER JOIN roles ON users.role_id = roles.role_id
     WHERE users.user_id = ?`,
    [req.user.user_id],
    (error, results) => {
      if (error) {
        console.error('Profile retrieval error:', error);
        return res.status(500).json({ success: false, message: 'Could not retrieve user profile.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'User profile not found.' });
      }

      return res.json({ success: true, user: results[0] });
    }
  );
});

// ADMINISTRATOR: GET ALL USERS
router.get('/', protect, authorize('Administrator'), (req, res) => {
  db.query(
    `SELECT
       users.user_id,
       users.full_name,
       users.email,
       roles.role_name,
       users.account_status
     FROM users
     INNER JOIN roles ON users.role_id = roles.role_id
     ORDER BY users.user_id DESC`,
    (error, results) => {
      if (error) {
        console.error('User retrieval error:', error);
        return res.status(500).json({ success: false, message: 'Could not retrieve registered users.' });
      }

      return res.json({
        success: true,
        total: results.length,
        users: results
      });
    }
  );
});

// ADMINISTRATOR: CREATE A NEW STAFF USER (RESTRICTED)
router.post('/', protect, authorize('Administrator'), async (req, res) => {
  try {
    const { full_name, email, password, role_id } = req.body;

    if (!full_name || !email || !password || !role_id) {
      return res.status(400).json({ success: false, message: 'All fields (name, email, password, role) are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // SECURITY CHECK: Ensure the requested role is a Staff role
    db.query('SELECT role_name FROM roles WHERE role_id = ?', [role_id], async (roleErr, roleRes) => {
      if (roleErr || roleRes.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid role selected.' });
      }

      const staffRoles = ['Administrator', 'Gallery Curator', 'Tour Guide', 'Booking Officer'];
      if (!staffRoles.includes(roleRes[0].role_name)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Admins can only create Staff accounts. Visitors, Artists, and Collectors must self-register.' 
        });
      }

      // Proceed with creation if role is valid
      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        `INSERT INTO users (full_name, email, password, role_id, account_status)
         VALUES (?, ?, ?, ?, 'Active')`,
        [full_name.trim(), email.trim().toLowerCase(), hashedPassword, role_id],
        (error, result) => {
          if (error) {
            if (error.code === 'ER_DUP_ENTRY') {
              return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
            }
            console.error('Admin create user error:', error);
            return res.status(500).json({ success: false, message: 'Failed to create user account.' });
          }

          return res.status(201).json({
            success: true,
            message: 'Staff account created successfully.',
            user_id: result.insertId
          });
        }
      );
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ADMINISTRATOR: UPDATE ACCOUNT STATUS OR ROLE
router.put('/:id/update', protect, authorize('Administrator'), (req, res) => {
  const userId = Number(req.params.id);
  const { account_status, role_id } = req.body;

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid user ID.' });
  }

  if (userId === Number(req.user.user_id)) {
    return res.status(403).json({ success: false, message: 'You cannot modify your own account.' });
  }

  let query = 'UPDATE users SET ';
  let values = [];

  if (account_status) {
    const allowedStatuses = ['Active', 'Inactive', 'Suspended'];
    if (!allowedStatuses.includes(account_status)) {
      return res.status(400).json({ success: false, message: 'Invalid account status.' });
    }
    query += 'account_status = ? ';
    values.push(account_status);
  }

  if (role_id) {
    query += values.length > 0 ? ', role_id = ? ' : 'role_id = ? ';
    values.push(role_id);
  }

  if (values.length === 0) {
    return res.status(400).json({ success: false, message: 'No changes provided.' });
  }

  query += 'WHERE user_id = ?';
  values.push(userId);

  db.query(query, values, (error, result) => {
    if (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ success: false, message: 'Could not update user.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, message: 'User updated successfully.' });
  });
});

module.exports = router;