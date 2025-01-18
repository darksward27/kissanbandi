const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, admin } = require('../middleware/auth');

// Public routes
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProduct);

// Admin routes
router.post('/', [auth, admin], productController.createProduct);
router.put('/:id', [auth, admin], productController.updateProduct);
router.delete('/:id', [auth, admin], productController.deleteProduct);
router.patch('/:id/stock', [auth, admin], productController.updateStock);

module.exports = router; 