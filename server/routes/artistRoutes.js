
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  createArtistProfile,
  getMyArtistProfile,
  updateArtistProfile,
  getPublicArtists
} = require('../controllers/artistController');

// Public artist directory
router.get('/public', getPublicArtists);

// Artist profile operations
router.post(
  '/',
  protect,
  authorize('Artist'),
  createArtistProfile
);

router.get(
  '/my-profile',
  protect,
  authorize('Artist'),
  getMyArtistProfile
);

router.put(
  '/my-profile',
  protect,
  authorize('Artist'),
  updateArtistProfile
);

module.exports = router;
