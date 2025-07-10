const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

// Protected routes (no params) - MUST come first
router.post('/', auth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);

// Admin routes (no params) - MUST come before parameterized routes
router.get('/admin/all', [auth, admin], orderController.getAllOrders);
router.get('/admin/stats', [auth, admin], orderController.getOrderStats);
router.get('/admin/export', [auth, admin], orderController.exportOrders);
router.get('/admin/date-range', [auth, admin], orderController.getOrdersByDateRange);

// Razorpay routes (no params)
router.post('/razorpay/create', auth, orderController.createRazorpayOrder);
router.post('/razorpay/verify', auth, orderController.verifyPayment);

// Transaction routes (no params)
router.get('/transactions', [auth, admin], orderController.getAllTransactions);
router.get('/transactions/stats', [auth, admin], orderController.getTransactionStats);

// Specific parameterized routes (MUST come before generic :id routes)
router.get('/:orderId/download-invoice', auth, orderController.downloadInvoice);
router.get('/transactions/:transactionId', auth, orderController.getTransactionDetails);
router.post('/transactions/:orderId/refund', [auth, admin], orderController.processRefund);

// Edit shipping address route
router.patch('/:id/address', auth, orderController.editOrderAddress);

// Get orders by id (for invoice generation) - THIS IS THE KEY ROUTE
router.get('/:orderId', auth, orderController.getOrderById);

// Other parameterized routes (MUST come last)
router.get('/:id', auth, orderController.getOrder);
router.post('/:id/cancel', auth, orderController.cancelOrder);
router.patch('/:id/status', [auth, admin], orderController.updateOrderStatus);
router.patch('/:id/payment', [auth, admin], orderController.updatePaymentStatus);

module.exports = router;