
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  getPublicExhibitions,
  getAllExhibitions,
  createExhibition,
  updateExhibition,
  addArtworkToExhibition,
  removeArtworkFromExhibition,
  getExhibitionArtworks
} = require('../controllers/exhibitionController');

// Public exhibition browsing
router.get('/public', getPublicExhibitions);

// View artworks in an exhibition
router.get('/:id/artworks', getExhibitionArtworks);

// Administrator and Gallery Curator operations
router.get(
  '/',
  protect,
  authorize('Administrator', 'Gallery Curator'),
  getAllExhibitions
);

router.post(
  '/',
  protect,
  authorize('Administrator', 'Gallery Curator'),
  createExhibition
);

router.put(
  '/:id',
  protect,
  authorize('Administrator', 'Gallery Curator'),
  updateExhibition
);

router.post(
  '/:id/artworks',
  protect,
  authorize('Administrator', 'Gallery Curator'),
  addArtworkToExhibition
);

router.delete(
  '/:id/artworks/:artworkId',
  protect,
  authorize('Administrator', 'Gallery Curator'),
  removeArtworkFromExhibition
);

module.exports = router;
