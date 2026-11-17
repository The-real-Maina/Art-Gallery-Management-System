
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  getPublicArtworks,
  getAllArtworks,
  getMyArtworks,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  reviewArtwork
} = require('../controllers/artworkController');

// Public artwork browsing
router.get('/public', getPublicArtworks);

// Artist operations
router.get('/my-artworks', protect, authorize('Artist'), getMyArtworks);
router.post('/', protect, authorize('Artist'), createArtwork);
router.put('/:id', protect, authorize('Artist'), updateArtwork);
router.delete('/:id', protect, authorize('Artist'), deleteArtwork);

// Administrator and Gallery Curator operations
router.get(
  '/',
  protect,
  authorize('Administrator', 'Gallery Curator'),
  getAllArtworks
);

router.patch(
  '/:id/review',
  protect,
  authorize('Administrator', 'Gallery Curator'),
  reviewArtwork
);

module.exports = router;
