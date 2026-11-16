
const express = require('express');
const router = express.Router();

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
        return res.status(500).json({
          success: false,
          message: 'Could not retrieve user profile.'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found.'
        });
      }

      return res.json({
        success: true,
        user: results[0]
      });
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
        return res.status(500).json({
          success: false,
          message: 'Could not retrieve registered users.'
        });
      }

      return res.json({
        success: true,
        total: results.length,
        users: results
      });
    }
  );
});

// ADMINISTRATOR: UPDATE ACCOUNT STATUS
router.put(
  '/:id/status',
  protect,
  authorize('Administrator'),
  (req, res) => {
    const userId = Number(req.params.id);
    const { account_status } = req.body;

    const allowedStatuses = ['Active', 'Inactive', 'Suspended'];

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
    }

    if (!allowedStatuses.includes(account_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account status.'
      });
    }

    if (userId === Number(req.user.user_id)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own account status.'
      });
    }

    db.query(
      'UPDATE users SET account_status = ? WHERE user_id = ?',
      [account_status, userId],
      (error, result) => {
        if (error) {
          console.error('Account status update error:', error);
          return res.status(500).json({
            success: false,
            message: 'Could not update account status.'
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'User account not found.'
          });
        }

        return res.json({
          success: true,
          message: `Account status changed to ${account_status}.`,
          user_id: userId,
          account_status
        });
      }
    );
  }
);

module.exports = router;
