const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  createFeedback,
  getMyFeedback,
  getAllFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');

// All feedback routes require authentication
router.use(protect);

// Visitor feedback
router.post('/', authorize('Visitor'), createFeedback);
router.get('/my-feedback', authorize('Visitor'), getMyFeedback);

// Administrative feedback management
router.get(
  '/',
  authorize('Administrator', 'Gallery Curator'),
  getAllFeedback
);

// Administrator feedback moderation
router.delete(
  '/:id',
  authorize('Administrator'),
  deleteFeedback
);

module.exports = router;