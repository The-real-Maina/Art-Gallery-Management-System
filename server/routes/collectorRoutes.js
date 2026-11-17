const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  addFavourite,
  getMyFavourites,
  removeFavourite,
  createPurchaseInquiry,
  getMyPurchaseInquiries,
  getArtistInquiries,
  respondToInquiry,
  getAllPurchaseInquiries
} = require('../controllers/collectorController');

// All collector routes require authentication
router.use(protect);

// Art Collector favourites
router.post(
  '/favourites',
  authorize('Art Collector'),
  addFavourite
);

router.get(
  '/favourites',
  authorize('Art Collector'),
  getMyFavourites
);

router.delete(
  '/favourites/:id',
  authorize('Art Collector'),
  removeFavourite
);

// Art Collector purchase inquiries
router.post(
  '/inquiries',
  authorize('Art Collector'),
  createPurchaseInquiry
);

router.get(
  '/inquiries',
  authorize('Art Collector'),
  getMyPurchaseInquiries
);

// Administrator inquiry oversight
router.get(
  '/inquiries/all',
  authorize('Administrator'),
  getAllPurchaseInquiries
);

// Artist inquiry management
router.get(
  '/artist/inquiries',
  authorize('Artist'),
  getArtistInquiries
);

router.patch(
  '/artist/inquiries/:id',
  authorize('Artist'),
  respondToInquiry
);

module.exports = router;