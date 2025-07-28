const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const productController = require('../controllers/productController');
const { auth, admin } = require('../middleware/auth');
const { 
  uploadProductImages, 
  uploadSingleProductImage, 
  handleUploadError, 
  processUploadedFiles, 
  useCloudinary 
} = require('../middleware/upload');

// ✅ Public routes (specific routes FIRST, then dynamic routes)
router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/categories', productController.getCategories);
router.get('/brands', productController.getBrands);
router.get('/featured', productController.getFeaturedProducts);

// ✅ TEST ROUTES - Must come BEFORE /:id route
router.get('/test-cloudinary', (req, res) => {
  const cloudinaryConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    success: true,
    environment: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
      USE_CLOUDINARY: process.env.USE_CLOUDINARY,
      NODE_ENV: process.env.NODE_ENV
    },
    configuration: {
      cloudinaryConfigured,
      useCloudinary,
      decision: useCloudinary ? 'Using Cloudinary' : 'Using Local Storage',
      reason: cloudinaryConfigured ? 'All credentials present' : 'Missing credentials'
    },
    instructions: cloudinaryConfigured ? 
      'Cloudinary is configured and should be working!' : 
      'Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file'
  });
});

// ✅ UTILITY ROUTES - Also before /:id
router.get('/storage-info', [auth, admin], (req, res) => {
  res.json({
    storageType: useCloudinary ? 'Cloudinary' : 'Local',
    maxFileSize: '10MB',
    maxFilesPerProduct: 10,
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  });
});

router.get('/upload-health', [auth, admin], (req, res) => {
  try {
    const uploadStatus = {
      status: 'healthy',
      storageType: useCloudinary ? 'Cloudinary' : 'Local',
      timestamp: new Date().toISOString()
    };

    if (useCloudinary) {
      uploadStatus.cloudinary = {
        configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'Not configured'
      };
    }

    res.json(uploadStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// ✅ Dynamic route LAST - this catches everything else
router.get('/:id', productController.getProduct);

// ✅ IMAGE UPLOAD ROUTES (Admin only)
router.post('/upload-images', [auth, admin], uploadProductImages, handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const uploadedImages = processUploadedFiles(req.files);
    const imageUrls = uploadedImages.map(img => img.url || img.secure_url);
    
    res.json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      images: imageUrls,
      files: uploadedImages.map(img => ({
        filename: img.filename || img.publicId,
        originalName: img.originalName,
        size: img.size,
        url: img.url || img.secure_url
      })),
      storageType: useCloudinary ? 'Cloudinary' : 'Local'
    });
  } catch (error) {
    console.error('Upload images error:', error);
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

    const uploadedImage = processUploadedFiles(req.file)[0];
    const imageUrl = uploadedImage.url || uploadedImage.secure_url;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      image: imageUrl,
      file: {
        filename: uploadedImage.filename || uploadedImage.publicId,
        originalName: uploadedImage.originalName,
        size: uploadedImage.size,
        url: imageUrl
      },
      storageType: useCloudinary ? 'Cloudinary' : 'Local'
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ CREATE PRODUCT WITH IMAGES
router.post('/create-with-images', [auth, admin], uploadProductImages, handleUploadError, async (req, res) => {
  try {
    console.log('📨 Received request body:', req.body);
    console.log('📁 Received files:', req.files?.length || 0);
    console.log('🏪 Storage type:', useCloudinary ? 'Cloudinary' : 'Local');

    const {
      name, category, subcategory, price, originalPrice, unit, stock, 
      description, gst, status, brand, tags, features
    } = req.body;

    console.log('📊 GST value received:', gst, typeof gst);

    if (!name || !category || !price || !unit || !stock || !description || gst === undefined || gst === '') {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, category, price, unit, stock, description, gst'
      });
    }

    const gstValue = Number(gst);
    if (isNaN(gstValue) || gstValue < 0 || gstValue > 100) {
      return res.status(400).json({
        success: false,
        error: 'GST rate must be between 0% and 100%'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one product image is required'
      });
    }

    const uploadedImages = processUploadedFiles(req.files);
    const imagePaths = uploadedImages.map(img => img.url || img.secure_url);
    
    console.log('📸 Generated image paths:', imagePaths);
    console.log('🏪 Images stored in:', useCloudinary ? 'Cloudinary' : 'Local storage');

    const productData = {
      name: name.trim(),
      category: category.trim(),
      subcategory: subcategory?.trim() || '',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      unit: unit.trim(),
      stock: Number(stock),
      description: description.trim(),
      gst: Number(gst),
      status: status || 'active',
      brand: brand?.trim() || '',
      images: imagePaths,
      image: imagePaths[0],
      createdBy: req.user._id
    };

    if (tags) {
      if (typeof tags === 'string') {
        productData.tags = tags.split(',').map(t => t.trim()).filter(t => t);
      } else if (Array.isArray(tags)) {
        productData.tags = tags.filter(t => t && t.trim());
      }
    }

    if (features) {
      if (typeof features === 'string') {
        productData.features = features.split(',').map(f => f.trim()).filter(f => f);
      } else if (Array.isArray(features)) {
        productData.features = features.filter(f => f && f.trim());
      }
    }

    if (productData.originalPrice && productData.price) {
      productData.discount = Math.round((1 - productData.price / productData.originalPrice) * 100);
    }

    console.log('💾 Creating product with data:', productData);
    console.log('📊 Final GST value being saved:', productData.gst, typeof productData.gst);

    const product = new Product(productData);
    await product.save();

    console.log('✅ Product created successfully:', product._id);
    console.log('📊 Saved product GST:', product.gst);
    console.log('🏪 Images saved to:', useCloudinary ? 'Cloudinary' : 'Local storage');

    res.status(201).json({
      success: true,
      message: 'Product created successfully with images',
      product,
      uploadedImages: imagePaths.length,
      storageType: useCloudinary ? 'Cloudinary' : 'Local'
    });

  } catch (error) {
    console.error('❌ Product creation error:', error);
    
    if (req.files && req.files.length > 0) {
      try {
        const { deleteImages } = require('../middleware/upload');
        const uploadedImages = processUploadedFiles(req.files);
        const imageUrls = uploadedImages.map(img => img.url || img.secure_url);
        await deleteImages(imageUrls);
        console.log('🧹 Cleaned up uploaded images after error');
      } catch (cleanupError) {
        console.error('Error cleaning up images:', cleanupError);
      }
    }
    
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

// ✅ ADMIN ROUTES
router.post('/', [auth, admin], uploadProductImages, handleUploadError, productController.createProduct);
router.put('/:id', [auth, admin], uploadProductImages, handleUploadError, productController.updateProduct);
router.delete('/:id', [auth, admin], productController.deleteProduct);
router.patch('/:id/stock', [auth, admin], productController.updateStock);
router.patch('/:id/inactive', [auth, admin], productController.InactiveProduct);
router.patch('/:id/active', [auth, admin], productController.ActiveProduct);

// ✅ IMAGE MANAGEMENT ROUTES
router.post('/:id/images', [auth, admin], uploadSingleProductImage, handleUploadError, productController.addImage);
router.delete('/:id/images', [auth, admin], productController.removeImage);
router.put('/:id/images/reorder', [auth, admin], productController.reorderImages);

module.exports = router;