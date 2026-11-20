const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

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

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `artwork-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Public artwork browsing
router.get('/public', getPublicArtworks);

// Artist operations (UPLOAD MIDDLEWARE ADDED)
router.get('/my-artworks', protect, authorize('Artist'), getMyArtworks);
router.post('/', protect, authorize('Artist'), upload.single('image_file'), createArtwork);
router.put('/:id', protect, authorize('Artist'), upload.single('image_file'), updateArtwork);
router.delete('/:id', protect, authorize('Artist'), deleteArtwork);

// Administrator and Gallery Curator operations
router.get('/', protect, authorize('Administrator', 'Gallery Curator'), getAllArtworks);
router.patch('/:id/review', protect, authorize('Administrator', 'Gallery Curator'), reviewArtwork);

module.exports = router;