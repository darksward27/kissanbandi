const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

// Protected routes
router.post('/', auth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/:id', auth, orderController.getOrder);
router.post('/:id/cancel', auth, orderController.cancelOrder);

// Admin routes
router.get('/', [auth, admin], orderController.getAllOrders);
router.get('/date-range', [auth, admin], orderController.getOrdersByDateRange);
router.get('/export', [auth, admin], orderController.exportOrders);
router.get('/stats', [auth, admin], orderController.getOrderStats);
router.patch('/:id/status', [auth, admin], orderController.updateOrderStatus);
router.patch('/:id/payment', [auth, admin], orderController.updatePaymentStatus);

module.exports = router; 