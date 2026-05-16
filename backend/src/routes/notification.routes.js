const express = require('express');
const router = express.Router();
const { getNotifications, markRead } = require('../controllers/misc.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, getNotifications);
router.patch('/read', authenticate, markRead);

module.exports = router;
