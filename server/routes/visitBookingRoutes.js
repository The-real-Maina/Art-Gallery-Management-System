const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  createVisitBooking,
  getMyVisitBookings,
  getAllVisitBookings,
  updateVisitBookingStatus,
  cancelMyVisitBooking
} = require('../controllers/visitBookingController');

// All booking routes require authentication
router.use(protect);

// Visitor operations
router.post(
  '/',
  authorize('Visitor'),
  createVisitBooking
);

router.get(
  '/my-bookings',
  authorize('Visitor'),
  getMyVisitBookings
);

router.patch(
  '/:id/cancel',
  authorize('Visitor'),
  cancelMyVisitBooking
);

// Booking Officer and Administrator operations
router.get(
  '/',
  authorize('Booking Officer', 'Administrator'),
  getAllVisitBookings
);

router.patch(
  '/:id/status',
  authorize('Booking Officer', 'Administrator'),
  updateVisitBookingStatus
);

module.exports = router;