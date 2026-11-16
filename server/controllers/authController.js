
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER A NEW VISITOR
exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, email and password.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `SELECT role_id FROM roles WHERE role_name = 'Visitor'`,
      (roleError, roleResults) => {
        if (roleError) {
          return res.status(500).json({
            success: false,
            message: 'Could not retrieve the default user role.'
          });
        }

        if (roleResults.length === 0) {
          return res.status(500).json({
            success: false,
            message: 'Visitor role has not been configured.'
          });
        }

        db.query(
          `INSERT INTO users
           (full_name, email, password, role_id, account_status)
           VALUES (?, ?, ?, ?, 'Active')`,
          [
            full_name.trim(),
            email.trim().toLowerCase(),
            hashedPassword,
            roleResults[0].role_id
          ],
          (insertError, result) => {
            if (insertError) {
              if (insertError.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                  success: false,
                  message: 'An account with this email already exists.'
                });
              }

              console.error('Registration error:', insertError);

              return res.status(500).json({
                success: false,
                message: 'Registration failed.'
              });
            }

            return res.status(201).json({
              success: true,
              message: 'Account registered successfully.',
              userId: result.insertId
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Registration error:', error);

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during registration.'
    });
  }
};

// LOGIN AN EXISTING USER
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your email and password.'
    });
  }

  db.query(
    `SELECT
       users.user_id,
       users.full_name,
       users.email,
       users.password,
       users.account_status,
       roles.role_name
     FROM users
     INNER JOIN roles ON users.role_id = roles.role_id
     WHERE users.email = ?`,
    [email.trim().toLowerCase()],
    async (error, results) => {
      if (error) {
        console.error('Login database error:', error);

        return res.status(500).json({
          success: false,
          message: 'Login failed.'
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const user = results[0];

      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      if (user.account_status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: `Your account is ${user.account_status?.toLowerCase() || 'unavailable'}. Please contact the gallery administrator.`
        });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          role: user.role_name
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          role: user.role_name
        }
      });
    }
  );
};
