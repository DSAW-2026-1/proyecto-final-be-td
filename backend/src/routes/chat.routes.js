const express = require('express');
const router = express.Router();
const { getOrCreateConversation, getMyConversations, getConversationMessages } = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/conversations', authenticate, getOrCreateConversation);
router.get('/conversations', authenticate, getMyConversations);
router.get('/conversations/:id/messages', authenticate, getConversationMessages);

module.exports = router;
