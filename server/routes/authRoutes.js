const express = require('express');
const router = express.Router();

const {
  register,
  login,
  verifyOTP,
  forgotPassword,
  resetPassword,
  requestPasswordChange,
  verifyPasswordChange
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Change Password Routes (Dashboard)
router.post('/change-password', protect, requestPasswordChange);
router.post('/verify-password-change', verifyPasswordChange);

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication routes are working!'
  });
});

module.exports = router;