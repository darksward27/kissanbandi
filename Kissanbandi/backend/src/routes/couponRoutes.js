const express = require('express');
const router = express.Router();

console.log('🎫 Loading coupon routes...');

// Import middlewares - FIXED: Match your auth.js exports
const { auth, admin } = require('../middleware/auth'); 

// Import controller
const couponController = require('../controllers/couponController');

// Import validation middleware
const { body, param, query } = require('express-validator');

// 🔓 PUBLIC ROUTES (No Auth)
router.get('/public/:code', [
  param('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Invalid coupon code format')
], couponController.getPublicCouponInfo);

router.get('/active/public', couponController.getActiveCouponsPublic);

// 🔐 AUTHENTICATED USER ROUTES
router.use(auth); // all routes below this line require authentication

// Get available coupons for user
router.get('/available', [
  query('cartTotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cart total must be a positive number')
], couponController.getAvailableCoupons);

// Validate coupon
router.post('/validate', [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required'),
  body('cartTotal')
    .isFloat({ min: 0 })
    .withMessage('Cart total must be a positive number'),
  body('cartItems')
    .optional()
    .isArray()
    .withMessage('Cart items must be an array')
], couponController.validateCoupon);

// Apply coupon (called after order creation)
router.post('/apply', [
  body('couponId')
    .isMongoId()
    .withMessage('Valid coupon ID is required'),
  body('orderId')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('orderValue')
    .isFloat({ min: 0 })
    .withMessage('Order value must be a positive number'),
  body('discountGiven')
    .isFloat({ min: 0 })
    .withMessage('Discount given must be a positive number')
], couponController.applyCoupon);

// ✅ NEW: Update coupon usage after successful payment
router.post('/:couponId/usage', [
  param('couponId')
    .isMongoId()
    .withMessage('Valid coupon ID is required'),
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('discountAmount')
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('orderTotal')
    .isFloat({ min: 0 })
    .withMessage('Order total must be a positive number'),
  body('usedAt')
    .optional()
    .isISO8601()
    .withMessage('Used at must be a valid date')
], couponController.updateCouponUsage);

// ✅ NEW: Reserve coupon for order (prevents race conditions)
// router.post('/:couponId/reserve', [
//   param('couponId')
//     .isMongoId()
//     .withMessage('Valid coupon ID is required'),
//   body('userId')
//     .isMongoId()
//     .withMessage('Valid user ID is required'),
//   body('discountAmount')
//     .isFloat({ min: 0 })
//     .withMessage('Discount amount must be a positive number'),
//   body('orderTotal')
//     .isFloat({ min: 0 })
//     .withMessage('Order total must be a positive number'),
//   body('reservationTimeout')
//     .optional()
//     .isInt({ min: 60000, max: 1800000 }) // 1 minute to 30 minutes
//     .withMessage('Reservation timeout must be between 1 minute and 30 minutes')
// ], couponController.reserveCoupon);

router.post('/:couponId/usage', [
  // validation middleware
], couponController.updateCouponUsage);

// ✅ NEW: Release coupon reservation
router.post('/:couponId/release', [
  param('couponId')
    .isMongoId()
    .withMessage('Valid coupon ID is required'),
  body('reservationId')
    .notEmpty()
    .withMessage('Reservation ID is required')
], couponController.releaseCouponReservation);

// Get user's coupon usage history
router.get('/user/history', couponController.getUserCouponHistory);

// Get coupon suggestions for cart
router.post('/suggestions', [
  body('cartTotal')
    .isFloat({ min: 0 })
    .withMessage('Cart total must be a positive number'),
  body('cartItems')
    .optional()
    .isArray()
    .withMessage('Cart items must be an array')
], couponController.getCouponSuggestions);

// Check if user can use specific coupon
router.get('/can-use/:code', [
  param('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Invalid coupon code')
], couponController.canUseCoupon);

// 🔐👑 ADMIN ROUTES
router.use(admin); // all routes below this line require admin privileges

// Get all coupons with filtering, searching, and pagination
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'title', 'code', 'discountValue', 'currentUsage', 'totalSales'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('status')
    .optional()
    .isIn(['all', 'active', 'inactive', 'expired', 'scheduled', 'budget_exhausted', 'usage_limit_reached'])
    .withMessage('Invalid status filter')
], couponController.getAllCoupons);

// Create new coupon
router.post('/', [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Code must be 3-20 characters and contain only letters and numbers'),
  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either percentage or fixed'),
  body('discountValue')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('discountValue')
    .custom((value, { req }) => {
      if (req.body.discountType === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      return true;
    }),
  body('minOrderValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be a positive number'),
  body('maxUsageCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max usage count must be a positive integer'),
  body('usagePerUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage per user must be a positive integer'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('endDate')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('userGroups')
    .optional()
    .isIn(['all', 'new', 'premium'])
    .withMessage('User groups must be one of: all, new, premium')
], couponController.createCoupon);

// Get overall analytics
router.get('/analytics/overview', [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
], couponController.getOverallAnalytics);

// Export coupons
router.get('/export', [
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  query('status')
    .optional()
    .isIn(['all', 'active', 'inactive', 'expired'])
    .withMessage('Invalid status filter')
], couponController.exportCoupons);

// Bulk update coupon status
router.patch('/bulk/status', [
  body('couponIds')
    .isArray({ min: 1 })
    .withMessage('Coupon IDs array is required'),
  body('couponIds.*')
    .isMongoId()
    .withMessage('All coupon IDs must be valid'),
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean')
], couponController.bulkUpdateStatus);

// Get single coupon by ID
router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Invalid coupon ID')
], couponController.getCouponById);

// Get coupon analytics
router.get('/:id/analytics', [
  param('id')
    .isMongoId()
    .withMessage('Invalid coupon ID'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
], couponController.getCouponAnalytics);

// ✅ NEW: Get detailed coupon usage statistics
router.get('/:id/stats', [
  param('id')
    .isMongoId()
    .withMessage('Invalid coupon ID')
], couponController.getCouponStats);

// Update coupon
router.put('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Invalid coupon ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Code must be 3-20 characters and contain only letters and numbers'),
  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either percentage or fixed'),
  body('discountValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('discountValue')
    .optional()
    .custom((value, { req }) => {
      if (req.body.discountType === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      return true;
    })
], couponController.updateCoupon);

// Toggle coupon status
router.patch('/:id/toggle', [
  param('id')
    .isMongoId()
    .withMessage('Invalid coupon ID')
], couponController.toggleCouponStatus);

// Delete coupon
router.delete('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Invalid coupon ID')
], couponController.deleteCoupon);

// Get coupon usage history
router.get('/:id/usage-history', [
  param('id')
    .isMongoId()
    .withMessage('Invalid coupon ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], couponController.getCouponUsageHistory);

// Generate coupon performance report
router.get('/:id/report', [
  param('id')
    .isMongoId()
    .withMessage('Invalid coupon ID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid')
], couponController.generateCouponReport);

console.log('✅ All coupon routes loaded successfully');

module.exports = router;