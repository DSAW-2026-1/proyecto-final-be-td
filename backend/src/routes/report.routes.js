const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/misc.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, createReport);

module.exports = router;
