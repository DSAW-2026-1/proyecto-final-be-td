// order.routes.js
const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getSalesOrders, updateOrderStatus, getOrder } = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, createOrder);
router.get('/my', authenticate, getMyOrders);
router.get('/sales', authenticate, getSalesOrders);
router.get('/:id', authenticate, getOrder);
router.patch('/:id/status', authenticate, updateOrderStatus);

module.exports = router;
