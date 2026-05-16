const express = require('express');
const router = express.Router();
const { createReview, getSellerReviews } = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, createReview);
router.get('/seller/:sellerId', getSellerReviews);

module.exports = router;
