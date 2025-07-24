const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const productController = require('../controllers/productController');
const { auth, admin } = require('../middleware/auth');
const { uploadProductImages, uploadSingleProductImage, handleUploadError } = require('../middleware/upload');

// ✅ Public routes
router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/categories', productController.getCategories);
router.get('/brands', productController.getBrands);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', productController.getProduct);

// ✅ NEW: Image upload routes (Admin only)
router.post('/upload-images', [auth, admin], uploadProductImages, handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Generate URLs for uploaded files
    const imageUrls = req.files.map(file => `/uploads/product/${file.filename}`);
    
    res.json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      images: imageUrls,
      files: req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        url: `/uploads/product/${file.filename}`
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/upload-image', [auth, admin], uploadSingleProductImage, handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const imageUrl = `/uploads/product/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      image: imageUrl,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ NEW: Create product with image upload in one step
// Replace your create-with-images route with this fixed version:

// Replace your create-with-images route with this fixed version:

router.post('/create-with-images', [auth, admin], uploadProductImages, handleUploadError, async (req, res) => {
  try {
    console.log('📨 Received request body:', req.body);
    console.log('📁 Received files:', req.files?.length || 0);

    // ✅ FIXED: Extract and validate form data - INCLUDE GST
    const {
      name,
      category,
      subcategory,
      price,
      originalPrice,
      unit,
      stock,
      description,
      gst, // ✅ Added GST field here
      status
    } = req.body;

    // ✅ Add GST logging for debugging
    console.log('📊 GST value received:', gst, typeof gst);
    console.log('📊 GST as number:', Number(gst));

    // ✅ FIXED: Validate required fields - INCLUDE GST
    if (!name || !category || !price || !unit || !stock || !description || gst === undefined || gst === '') {
      console.error('❌ Missing required fields:', {
        name: !!name,
        category: !!category,
        price: !!price,
        unit: !!unit,
        stock: !!stock,
        description: !!description,
        gst: gst !== undefined && gst !== '' // ✅ Check GST properly
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, category, price, unit, stock, description, gst'
      });
    }

    // ✅ Validate GST range
    const gstValue = Number(gst);
    if (isNaN(gstValue) || gstValue < 0 || gstValue > 100) {
      return res.status(400).json({
        success: false,
        error: 'GST rate must be between 0% and 100%'
      });
    }

    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one product image is required'
      });
    }

    // Generate image paths
    const imagePaths = req.files.map(file => `/uploads/product/${file.filename}`);
    console.log('📸 Generated image paths:', imagePaths);

    // ✅ FIXED: Prepare product data - INCLUDE GST
    const productData = {
      name: name.trim(),
      category: category.trim(),
      subcategory: subcategory?.trim() || '',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      unit: unit.trim(),
      stock: Number(stock),
      description: description.trim(),
      gst: Number(gst), // ✅ Added GST field here with proper conversion
      status: status || 'active',
      images: imagePaths,
      image: imagePaths[0], // First image as main image
      createdBy: req.user._id
    };

    // Calculate discount if originalPrice is provided
    if (productData.originalPrice && productData.price) {
      productData.discount = Math.round((1 - productData.price / productData.originalPrice) * 100);
    }

    console.log('💾 Creating product with data:', productData);
    console.log('📊 Final GST value being saved:', productData.gst, typeof productData.gst);

    // Create and save product
    const Product = require('../models/Product');
    const product = new Product(productData);
    await product.save();

    console.log('✅ Product created successfully:', product._id);
    console.log('📊 Saved product GST:', product.gst);

    res.status(201).json({
      success: true,
      message: 'Product created successfully with images',
      product,
      uploadedImages: imagePaths.length
    });

  } catch (error) {
    console.error('❌ Product creation error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`);
      return res.status(400).json({
        success: false,
        error: 'Validation failed: ' + validationErrors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Product creation failed: ' + error.message
    });
  }
});


// ✅ Admin routes (existing)
router.post('/', [auth, admin], productController.createProduct);
router.put('/:id', [auth, admin], productController.updateProduct);
router.delete('/:id', [auth, admin], productController.deleteProduct);
router.patch('/:id/stock', [auth, admin], productController.updateStock);
router.patch('/:id/inactive', [auth, admin], productController.InactiveProduct);
router.patch('/:id/active', [auth, admin], productController.ActiveProduct);

// ✅ Image management routes (existing)
router.post('/:id/images', [auth, admin], productController.addImage);
router.delete('/:id/images', [auth, admin], productController.removeImage);
router.put('/:id/images/reorder', [auth, admin], productController.reorderImages);

module.exports = router;