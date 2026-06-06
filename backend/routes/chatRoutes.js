const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.use(protect);

router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.post('/conversations/:conversationId/seen', chatController.markSeen);

module.exports = router;
