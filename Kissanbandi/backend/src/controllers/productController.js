const Product = require('../models/Product');
const { processUploadedFiles, deleteImages, useCloudinary } = require('../middleware/upload');

// Get all products with filtering, sorting, and pagination
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      search,
      minPrice,
      maxPrice,
      sortBy,
      status,
      featured,
      brand,
      tags,
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = new RegExp(brand, 'i');
    if (featured !== undefined) query.featured = featured === 'true';
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'price-low':
        sortOptions.price = 1;
        break;
      case 'price-high':
        sortOptions.price = -1;
        break;
      case 'rating':
        sortOptions.rating = -1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'name':
        sortOptions.name = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Calculate total for pagination
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit)); // ensure it's a number

    res.json({
      products,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single product by ID
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Updated: Create new product with multiple images support (Cloudinary/Local)
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Convert numeric fields
    if (productData.price !== undefined) productData.price = Number(productData.price);
    if (productData.originalPrice !== undefined) productData.originalPrice = Number(productData.originalPrice);
    if (productData.gst !== undefined) productData.gst = Number(productData.gst);
    if (productData.stock !== undefined) productData.stock = Number(productData.stock);

    // Handle uploaded files using the updated upload middleware
    if (req.files && req.files.length > 0) {
      console.log('📁 Processing uploaded files:', req.files.length);
      const uploadedImages = processUploadedFiles(req.files);
      productData.images = uploadedImages.map(img => img.url || img.secure_url);
      productData.image = productData.images[0]; // Set first image as main image
      
      console.log('✅ Images processed successfully:', {
        count: uploadedImages.length,
        storageType: useCloudinary ? 'Cloudinary' : 'Local',
        urls: productData.images
      });
    } else if (req.file) {
      // Single image upload
      console.log('📁 Processing single uploaded file');
      const uploadedImage = processUploadedFiles(req.file);
      productData.images = [uploadedImage[0].url || uploadedImage[0].secure_url];
      productData.image = uploadedImage[0].url || uploadedImage[0].secure_url;
      
      console.log('✅ Single image processed successfully:', {
        storageType: useCloudinary ? 'Cloudinary' : 'Local',
        url: productData.image
      });
    } else {
      // Fallback to old logic for backward compatibility
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      if (req.body.images) {
        if (typeof req.body.images === 'string') {
          productData.images = [`${baseUrl}${req.body.images}`];
        } else if (Array.isArray(req.body.images)) {
          productData.images = req.body.images.map(img =>
            img.startsWith('http') ? img : `${baseUrl}${img}`
          );
        }
        if (productData.images.length > 0) {
          productData.image = productData.images[0];
        }
      } else if (req.body.image) {
        const imageUrl = req.body.image.startsWith('http') ? req.body.image : `${baseUrl}${req.body.image}`;
        productData.images = [imageUrl];
        productData.image = imageUrl;
      }
    }

    // Features
    if (req.body.features) {
      if (typeof req.body.features === 'string') {
        productData.features = req.body.features.split(',').map(f => f.trim()).filter(f => f);
      } else if (Array.isArray(req.body.features)) {
        productData.features = req.body.features.filter(f => f && f.trim());
      }
    }

    // Tags
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        productData.tags = req.body.tags.split(',').map(t => t.trim()).filter(t => t);
      } else if (Array.isArray(req.body.tags)) {
        productData.tags = req.body.tags.filter(t => t && t.trim());
      }
    }

    // Calculate discount
    if (productData.originalPrice && productData.price) {
      productData.discount = Math.round((1 - productData.price / productData.originalPrice) * 100);
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
      uploadedImages: productData.images?.length || 0,
      storageType: useCloudinary ? 'Cloudinary' : 'Local'
    });

  } catch (error) {
    console.error('Product creation error:', error);
    
    // If product creation fails but images were uploaded, clean them up
    if (req.files && req.files.length > 0) {
      try {
        const uploadedImages = processUploadedFiles(req.files);
        const imageUrls = uploadedImages.map(img => img.url || img.secure_url);
        await deleteImages(imageUrls);
        console.log('🧹 Cleaned up uploaded images after error');
      } catch (cleanupError) {
        console.error('Error cleaning up images:', cleanupError);
      }
    }
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ Updated: Update product with multiple images support (Cloudinary/Local)
exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const productId = req.params.id;
    
    // Get existing product to handle image deletion
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      console.log('📁 Processing new uploaded files for update:', req.files.length);
      const uploadedImages = processUploadedFiles(req.files);
      const newImageUrls = uploadedImages.map(img => img.url || img.secure_url);
      
      // Decide whether to replace or append images
      if (req.body.replaceImages === 'true') {
        // Delete old images
        if (existingProduct.images && existingProduct.images.length > 0) {
          try {
            await deleteImages(existingProduct.images);
            console.log('🧹 Deleted old images during update');
          } catch (deleteError) {
            console.error('Error deleting old images:', deleteError);
          }
        }
        updateData.images = newImageUrls;
      } else {
        // Append new images to existing ones
        updateData.images = [...(existingProduct.images || []), ...newImageUrls];
      }
      
      // Update main image
      updateData.image = updateData.images[0];
      
      console.log('✅ Images updated successfully:', {
        count: uploadedImages.length,
        storageType: useCloudinary ? 'Cloudinary' : 'Local',
        totalImages: updateData.images.length
      });
    } else {
      // Fallback to old logic for backward compatibility
      if (req.body.images) {
        if (typeof req.body.images === 'string') {
          updateData.images = [req.body.images];
        } else if (Array.isArray(req.body.images)) {
          updateData.images = req.body.images;
        }
        
        // Update main image to first image
        if (updateData.images.length > 0) {
          updateData.image = updateData.images[0];
        }
      }
    }

    // ✅ Handle features array
    if (req.body.features && typeof req.body.features === 'string') {
      updateData.features = req.body.features.split(',').map(f => f.trim());
    }

    // ✅ Handle tags array
    if (req.body.tags && typeof req.body.tags === 'string') {
      updateData.tags = req.body.tags.split(',').map(t => t.trim());
    }

    // ✅ Auto-set status to inactive if stock is 0
    if ('stock' in updateData && Number(updateData.stock) === 0) {
      updateData.status = 'inactive';
    }

    // ✅ Recalculate discount if prices are updated
    if (updateData.originalPrice && updateData.price) {
      updateData.discount = Math.round((1 - updateData.price / updateData.originalPrice) * 100);
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Product updated successfully',
      product,
      storageType: useCloudinary ? 'Cloudinary' : 'Local'
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ✅ Updated: Add image to existing product (Cloudinary/Local)
exports.addImage = async (req, res) => {
  try {
    let imageUrl;

    if (req.file) {
      // Handle uploaded file
      console.log('📁 Processing new image upload for existing product');
      const uploadedImage = processUploadedFiles(req.file);
      imageUrl = uploadedImage[0].url || uploadedImage[0].secure_url;
      
      console.log('✅ New image processed:', {
        storageType: useCloudinary ? 'Cloudinary' : 'Local',
        url: imageUrl
      });
    } else if (req.body.imageUrl) {
      // Handle provided URL (backward compatibility)
      imageUrl = req.body.imageUrl;
    } else {
      return res.status(400).json({ error: 'No image file or URL provided' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $push: { images: imageUrl } },
      { new: true, runValidators: true }
    );

    if (!product) {
      // If product not found, clean up the uploaded image
      if (req.file) {
        try {
          await deleteImages([imageUrl]);
        } catch (cleanupError) {
          console.error('Error cleaning up image:', cleanupError);
        }
      }
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Image added successfully',
      product,
      addedImage: imageUrl,
      storageType: useCloudinary ? 'Cloudinary' : 'Local'
    });
  } catch (error) {
    console.error('Add image error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ✅ Updated: Remove image from product (Cloudinary/Local)
exports.removeImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $pull: { images: imageUrl } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update main image if the removed image was the main image
    if (product.images.length > 0 && product.image === imageUrl) {
      product.image = product.images[0];
      await product.save();
    }

    // Delete image from storage (Cloudinary or local)
    try {
      await deleteImages([imageUrl]);
      console.log('🧹 Image deleted from storage:', imageUrl);
    } catch (deleteError) {
      console.error('Error deleting image from storage:', deleteError);
    }

    res.json({
      message: 'Image removed successfully',
      product,
      removedImage: imageUrl
    });
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ✅ New: Reorder images
exports.reorderImages = async (req, res) => {
  try {
    const { imageUrls } = req.body;
    
    if (!Array.isArray(imageUrls)) {
      return res.status(400).json({ error: 'Image URLs array is required' });
    }

    const updateData = { 
      images: imageUrls,
      image: imageUrls[0] // Set first image as main image
    };

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Images reordered successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Updated: Delete product with image cleanup (Cloudinary/Local)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete images from storage before deleting product
    if (product.images && product.images.length > 0) {
      try {
        await deleteImages(product.images);
        console.log('🧹 Deleted product images from storage');
      } catch (deleteError) {
        console.error('Error deleting images from storage:', deleteError);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Product and associated images deleted successfully',
      deletedImages: product.images?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark product as inactive
exports.InactiveProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ 
      message: 'Product marked as inactive successfully', 
      product: updatedProduct 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark product as active
exports.ActiveProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ 
      message: 'Product marked as active successfully', 
      product: updatedProduct 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product categories and subcategories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          subcategories: { $addToSet: '$subcategory' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          subcategories: {
            $filter: {
              input: '$subcategories',
              as: 'subcategory',
              cond: { $ne: ['$subcategory', null] }
            }
          },
          count: 1,
          _id: 0
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ New: Get all brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await Product.aggregate([
      { $match: { status: 'active', brand: { $ne: null } } },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product stock
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const numericStock = Number(stock);

    const updateData = { stock: numericStock };

    // Auto-set status based on stock
    if (numericStock === 0) {
      updateData.status = 'inactive';
    } else if (numericStock > 0) {
      updateData.status = 'active';
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Stock updated successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ New: Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.find({ 
      status: 'active', 
      featured: true 
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit));

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ New: Search products with advanced filtering
exports.searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;

    const query = { status: 'active' };
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOptions = {};
    switch (sortBy) {
      case 'price-low': sortOptions.price = 1; break;
      case 'price-high': sortOptions.price = -1; break;
      case 'rating': sortOptions.rating = -1; break;
      default: sortOptions.createdAt = -1;
    }

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      query: q
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};