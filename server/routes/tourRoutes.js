const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  getPublicTours,
  createTour,
  getMyTours,
  updateTour,
  cancelTour,
  completeTour,
  getTourBookings,
  updateTourBookingStatus,
  bookTour,
  getMyTourBookings,
  cancelMyTourBooking
} = require('../controllers/tourController');

// Public tour browsing
router.get('/public', getPublicTours);

// All remaining routes require authentication
router.use(protect);

// ---------- Tour Guide ----------
router.post('/', authorize('Tour Guide'), createTour);

router.get('/my-tours', authorize('Tour Guide'), getMyTours);

router.get('/:id/bookings', authorize('Tour Guide'), getTourBookings);

router.put('/:id', authorize('Tour Guide'), updateTour);

router.patch('/:id/cancel', authorize('Tour Guide'), cancelTour);

router.patch('/:id/complete', authorize('Tour Guide'), completeTour);

router.patch(
  '/bookings/:bookingId/status',
  authorize('Tour Guide'),
  updateTourBookingStatus
);

// ---------- Visitor ----------
router.post('/:id/book', authorize('Visitor'), bookTour);

router.get('/my-bookings', authorize('Visitor'), getMyTourBookings);

router.patch(
  '/bookings/:bookingId/cancel',
  authorize('Visitor'),
  cancelMyTourBooking
);

module.exports = router;