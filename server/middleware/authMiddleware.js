
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    db.query(
      `SELECT
         users.user_id,
         users.account_status,
         roles.role_name
       FROM users
       INNER JOIN roles ON users.role_id = roles.role_id
       WHERE users.user_id = ?`,
      [decoded.user_id],
      (error, results) => {
        if (error) {
          console.error('Authentication database error:', error);

          return res.status(500).json({
            success: false,
            message: 'Authentication could not be completed.'
          });
        }

        if (results.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'User account no longer exists.'
          });
        }

        const user = results[0];

        if (user.account_status !== 'Active') {
          return res.status(403).json({
            success: false,
            message: `Your account is ${user.account_status.toLowerCase()}. Please contact the gallery administrator.`
          });
        }

        req.user = {
          ...decoded,
          user_id: user.user_id,
          role: user.role_name
        };

        next();
      }
    );
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

module.exports = { protect };
