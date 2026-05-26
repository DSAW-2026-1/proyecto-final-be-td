const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/misc.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/:id', getProfile);
router.put('/me', authenticate, upload.single('photo'), updateProfile);

module.exports = router;
