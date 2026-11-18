const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: Print OTP to Terminal (No email sending)
const printOTPToTerminal = (email, otp) => {
  console.log('\n==================================================');
  console.log('🔐 ARTISAN GALLERY - OTP VERIFICATION');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 CODE: ${otp}`);
  console.log('⏳ Expires: 10 minutes');
  console.log('==================================================\n');
};

// REGISTER A NEW USER
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, role_name = 'Visitor' } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all fields.' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const allowedRoles = ['Visitor', 'Artist', 'Art Collector'];
    if (!allowedRoles.includes(role_name)) {
      return res.status(403).json({ success: false, message: 'Invalid account type selected.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    db.query(`SELECT role_id FROM roles WHERE role_name = ?`, [role_name], (roleErr, roleRes) => {
      if (roleErr || roleRes.length === 0) {
        return res.status(500).json({ success: false, message: 'Role configuration error.' });
      }

      db.query(
        `INSERT INTO users (full_name, email, password, role_id, account_status, otp_code, otp_expires_at)
         VALUES (?, ?, ?, ?, 'Inactive', ?, ?)`,
        [full_name.trim(), email.trim().toLowerCase(), hashedPassword, roleRes[0].role_id, otp, otpExpires],
        (insertErr, result) => {
          if (insertErr) {
            if (insertErr.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Email already exists.' });
            return res.status(500).json({ success: false, message: 'Registration failed.' });
          }

          printOTPToTerminal(email, otp);
          return res.status(201).json({ success: true, message: 'OTP generated. Please check the server terminal.', email });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// LOGIN
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    `SELECT users.*, roles.role_name FROM users INNER JOIN roles ON users.role_id = roles.role_id WHERE users.email = ?`,
    [email.trim().toLowerCase()],
    async (error, results) => {
      if (error || results.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

      if (user.account_status === 'Suspended') {
        return res.status(403).json({ success: false, message: 'Account suspended. Contact Admin.' });
      }

      // 1. ADMIN BYPASSES OTP
      if (user.role_name === 'Administrator') {
        const token = jwt.sign({ user_id: user.user_id, role: user.role_name }, process.env.JWT_SECRET, { expiresIn: '30m' });
        return res.json({ success: true, token, user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role_name } });
      }

      // 2. VISITOR BYPASSES OTP ON LOGIN
      if (user.role_name === 'Visitor') {
        if (user.account_status === 'Inactive') {
          return res.status(403).json({ success: false, message: 'Please verify your email with the OTP sent during registration.' });
        }
        
        const token = jwt.sign({ user_id: user.user_id, role: user.role_name }, process.env.JWT_SECRET, { expiresIn: '30m' });
        return res.json({ success: true, token, user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role_name } });
      }

      // 3. ALL OTHER ROLES REQUIRE OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      db.query(`UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE user_id = ?`, [otp, otpExpires, user.user_id], (updErr, updRes) => {
        if (updErr) {
          console.error("❌ DATABASE ERROR SAVING OTP:", updErr);
          return res.status(500).json({ success: false, message: 'Failed to save OTP to database.' });
        }
        
        printOTPToTerminal(user.email, otp);
        return res.json({ success: true, require_otp: true, email: user.email, message: 'OTP generated. Please check the server terminal.' });
      });
    }
  );
};

// VERIFY OTP (Login / Registration)
exports.verifyOTP = (req, res) => {
  const { email, otp } = req.body;

  db.query(
    `SELECT users.*, roles.role_name FROM users INNER JOIN roles ON users.role_id = roles.role_id WHERE users.email = ? AND users.otp_code = ?`,
    [email.trim().toLowerCase(), otp],
    (error, results) => {
      if (error) {
        console.error("❌ DATABASE ERROR VERIFYING OTP:", error);
        return res.status(500).json({ success: false, message: 'Database error during verification.' });
      }

      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid OTP.' });
      }

      const user = results[0];
      const now = new Date();
      const expiry = new Date(user.otp_expires_at);
      
      if (expiry < now) {
        return res.status(401).json({ success: false, message: 'OTP has expired. Please try again.' });
      }

      db.query(
        `UPDATE users SET otp_code = NULL, otp_expires_at = NULL, account_status = 'Active' WHERE user_id = ?`,
        [user.user_id],
        () => {
          const token = jwt.sign({ user_id: user.user_id, role: user.role_name }, process.env.JWT_SECRET, { expiresIn: '30m' });
          return res.json({ success: true, token, user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role_name } });
        }
      );
    }
  );
};

// FORGOT PASSWORD (Step 1: Request OTP)
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  db.query(
    `SELECT users.user_id, roles.role_name FROM users INNER JOIN roles ON users.role_id = roles.role_id WHERE users.email = ?`,
    [email.trim().toLowerCase()],
    (error, results) => {
      if (error || results.length === 0) {
        return res.status(404).json({ success: false, message: 'No account found with this email.' });
      }

      const user = results[0];

      // SECURITY: Admin cannot reset password here
      if (user.role_name === 'Administrator') {
        return res.status(403).json({ success: false, message: 'Administrators cannot reset passwords via the public site. Please contact system support.' });
      }

      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      db.query(
        `UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE user_id = ?`,
        [otp, otpExpires, user.user_id],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ success: false, message: 'Failed to generate OTP.' });
          }

          printOTPToTerminal(email, otp);
          return res.json({ success: true, message: 'OTP sent to terminal.', email: email.trim().toLowerCase() });
        }
      );
    }
  );
};

// RESET PASSWORD (Step 2: Verify OTP and Save New Password)
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  db.query(
    `SELECT user_id, otp_expires_at FROM users WHERE email = ? AND otp_code = ?`,
    [cleanEmail, cleanOtp],
    async (error, results) => {
      if (error || results.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid OTP.' });
      }

      const user = results[0];
      const now = new Date();
      
      if (new Date(user.otp_expires_at) < now) {
        return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        `UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL, account_status = 'Active' WHERE user_id = ?`,
        [hashedPassword, user.user_id],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ success: false, message: 'Failed to update password.' });
          }

          return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
        }
      );
    }
  );
};

// REQUEST PASSWORD CHANGE (From Dashboard)
exports.requestPasswordChange = (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user_id = req.user.user_id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
  }

  db.query(
    `SELECT users.*, roles.role_name FROM users INNER JOIN roles ON users.role_id = roles.role_id WHERE users.user_id = ?`,
    [user_id],
    async (error, results) => {
      if (error || results.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

      const user = results[0];
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) return res.status(401).json({ success: false, message: 'Incorrect current password.' });

      // 1. ADMIN BYPASS: Change password immediately without OTP
      if (user.role_name === 'Administrator') {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, user_id], (updErr) => {
          if (updErr) return res.status(500).json({ success: false, message: 'Failed to update password.' });
          return res.json({ success: true, message: 'Password changed successfully.' });
        });
        return;
      }

      // 2. OTHER ROLES: Generate OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      db.query(`UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE user_id = ?`, [otp, otpExpires, user_id], (updErr) => {
        if (updErr) return res.status(500).json({ success: false, message: 'Failed to generate OTP.' });
        
        printOTPToTerminal(user.email, otp);
        return res.json({ success: true, require_otp: true, message: 'OTP sent to terminal for verification.' });
      });
    }
  );
};

// VERIFY PASSWORD CHANGE (Step 2)
exports.verifyPasswordChange = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
  }

  db.query(
    `SELECT user_id, otp_expires_at FROM users WHERE email = ? AND otp_code = ?`,
    [email.trim().toLowerCase(), String(otp).trim()],
    async (error, results) => {
      if (error || results.length === 0) return res.status(401).json({ success: false, message: 'Invalid OTP.' });

      const user = results[0];
      if (new Date(user.otp_expires_at) < new Date()) {
        return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query(
        `UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL WHERE user_id = ?`,
        [hashedPassword, user.user_id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ success: false, message: 'Failed to update password.' });
          return res.json({ success: true, message: 'Password updated successfully.' });
        }
      );
    }
  );
};