const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getChatContacts, getMessages, sendMessage } = require('../controllers/messageController');

router.use(protect); // All chat routes require login

router.get('/contacts', getChatContacts);
router.get('/:userId', getMessages);
router.post('/', sendMessage);

module.exports = router;