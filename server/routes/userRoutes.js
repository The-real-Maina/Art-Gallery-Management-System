const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Roles the administrator is allowed to create and move accounts between.
// Visitors, Artists and Art Collectors register themselves.
const STAFF_ROLES = ['Administrator', 'Gallery Curator', 'Tour Guide', 'Booking Officer'];
const ACCOUNT_STATUSES = ['Active', 'Inactive', 'Suspended'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// UPDATE LOGGED-IN USER PROFILE
router.put('/profile', protect, (req, res) => {
  const { full_name } = req.body;

  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ success: false, message: 'Full name is required.' });
  }

  db.query(
    'UPDATE users SET full_name = ? WHERE user_id = ?',
    [full_name.trim(), req.user.user_id],
    (error) => {
      if (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ success: false, message: 'Could not update profile.' });
      }
      return res.json({ success: true, message: 'Profile updated successfully.', full_name: full_name.trim() });
    }
  );
});

// ADMINISTRATOR: LIST ROLES (used by the Add Staff / change role dropdowns)
router.get('/roles', protect, authorize('Administrator'), (req, res) => {
  db.query(
    'SELECT role_id, role_name FROM roles ORDER BY role_id',
    (error, results) => {
      if (error) {
        console.error('Roles retrieval error:', error);
        return res.status(500).json({ success: false, message: 'Could not retrieve roles.' });
      }

      return res.json({ success: true, roles: results });
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
       users.role_id,
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
router.post('/', protect, authorize('Administrator'), (req, res) => {
  const { full_name, email, password, role_id } = req.body;

  if (!full_name || !full_name.trim() || !email || !password || !role_id) {
    return res.status(400).json({ success: false, message: 'All fields (name, email, password, role) are required.' });
  }

  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  // SECURITY CHECK: the requested role must be a staff role
  db.query('SELECT role_name FROM roles WHERE role_id = ?', [role_id], async (roleErr, roleRes) => {
    if (roleErr || roleRes.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid role selected.' });
    }

    if (!STAFF_ROLES.includes(roleRes[0].role_name)) {
      return res.status(403).json({
        success: false,
        message: 'Admins can only create Staff accounts. Visitors, Artists, and Collectors must self-register.'
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(String(password), 10);

      db.query(
        `INSERT INTO users (full_name, email, password, role_id, account_status)
         VALUES (?, ?, ?, ?, 'Active')`,
        [full_name.trim(), String(email).trim().toLowerCase(), hashedPassword, role_id],
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
    } catch (error) {
      console.error('Admin create user error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  });
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

  if (!account_status && !role_id) {
    return res.status(400).json({ success: false, message: 'No changes provided.' });
  }

  if (account_status && !ACCOUNT_STATUSES.includes(account_status)) {
    return res.status(400).json({ success: false, message: 'Invalid account status.' });
  }

  const applyUpdate = () => {
    const assignments = [];
    const values = [];

    if (account_status) {
      assignments.push('account_status = ?');
      values.push(account_status);
    }
    if (role_id) {
      assignments.push('role_id = ?');
      values.push(Number(role_id));
    }
    values.push(userId);

    db.query(
      `UPDATE users SET ${assignments.join(', ')} WHERE user_id = ?`,
      values,
      (error, result) => {
        if (error) {
          console.error('Update user error:', error);
          return res.status(500).json({ success: false, message: 'Could not update user.' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.json({ success: true, message: 'User updated successfully.' });
      }
    );
  };

  // Status-only change: no role checks needed
  if (!role_id) return applyUpdate();

  // Role change: both the current role and the new role must be staff roles
  db.query(
    `SELECT cur_r.role_name AS current_role_name,
            new_r.role_name AS new_role_name
     FROM users
     INNER JOIN roles AS cur_r ON users.role_id = cur_r.role_id
     INNER JOIN roles AS new_r ON new_r.role_id = ?
     WHERE users.user_id = ?`,
    [Number(role_id), userId],
    (error, rows) => {
      if (error) {
        console.error('Role check error:', error);
        return res.status(500).json({ success: false, message: 'Could not update user.' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User or role not found.' });
      }

      const { current_role_name, new_role_name } = rows[0];
      if (!STAFF_ROLES.includes(current_role_name) || !STAFF_ROLES.includes(new_role_name)) {
        return res.status(403).json({
          success: false,
          message: 'Roles can only be changed between staff roles. Visitors, Artists and Collectors keep the role they registered with.'
        });
      }

      return applyUpdate();
    }
  );
});

module.exports = router;