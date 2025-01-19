const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

// Protected routes (no params)
router.post('/', auth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);

// Admin routes (no params)
router.get('/', [auth, admin], orderController.getAllOrders);
router.get('/stats', [auth, admin], orderController.getOrderStats);
router.get('/export', [auth, admin], orderController.exportOrders);
router.get('/date-range', [auth, admin], orderController.getOrdersByDateRange);

// Razorpay routes
router.post('/razorpay/create', auth, orderController.createRazorpayOrder);
router.post('/razorpay/verify', auth, orderController.verifyPayment);

// Transaction routes
router.get('/transactions', [auth, admin], orderController.getAllTransactions);
router.get('/transactions/stats', [auth, admin], orderController.getTransactionStats);
router.get('/transactions/:transactionId', auth, orderController.getTransactionDetails);
router.post('/transactions/:orderId/refund', [auth, admin], orderController.processRefund);

// Parameterized routes (must come last)
router.get('/:id', auth, orderController.getOrder);
router.post('/:id/cancel', auth, orderController.cancelOrder);
router.patch('/:id/status', [auth, admin], orderController.updateOrderStatus);
router.patch('/:id/payment', [auth, admin], orderController.updatePaymentStatus);

module.exports = router; 