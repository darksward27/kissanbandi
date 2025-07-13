const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');

// Create a new review with optional image support
exports.createReview = async (req, res) => {
  let uploadedFiles = [];
  
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = req.user.userId || req.user._id;

    // Get uploaded files (if any)
    uploadedFiles = req.files || [];
    console.log('=== DEBUG: createReview ===');
    console.log('User ID:', userId);
    console.log('Product ID:', productId);
    console.log('Rating:', rating);
    console.log('Comment:', comment);
    console.log('Uploaded files:', uploadedFiles.length);

    // Validate required fields
    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, rating, and comment are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Validate comment length
    if (comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be at least 10 characters long'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({ 
        success: false,
        error: 'You have already reviewed this product' 
      });
    }

    // Process uploaded images (if any)
    let imageUrls = [];
    if (uploadedFiles && uploadedFiles.length > 0) {
      imageUrls = uploadedFiles.map(file => {
        // Return relative path from uploads directory
        return `/uploads/reviews/${file.filename}`;
      });
      console.log('Image URLs:', imageUrls);
    }

    // Create review
    const review = new Review({
      user: userId,
      product: productId,
      rating: parseInt(rating),
      title: title ? title.trim() : '',
      comment: comment.trim(),
      images: imageUrls,
      status: 'pending'
    });

    await review.save();

    // Populate user and product details for response
    await review.populate([
      { path: 'user', select: 'name email' },
      { path: 'product', select: 'name image price' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      review
    });

  } catch (error) {
    console.error('Error creating review:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: messages 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to create review',
      details: error.message
    });
  }
};

// Check if user can review a product
exports.canReviewProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId || req.user._id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      user: userId,
      product: productId
    });

    if (existingReview) {
      return res.json({
        success: true,
        canReview: false,
        reason: 'You have already reviewed this product'
      });
    }

    return res.json({
      success: true,
      canReview: true,
      reason: ''
    });

  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check review eligibility'
    });
  }
};

// Get public product reviews
exports.getPublicProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'newest',
      filterRating = 'all'
    } = req.query;

    if (!productId) {
      return res.status(400).json({ 
        success: false,
        error: 'Product ID is required' 
      });
    }

    const filter = {
      product: productId,
      status: 'approved'
    };

    if (filterRating !== 'all') {
      const ratingValue = parseInt(filterRating);
      if (ratingValue >= 1 && ratingValue <= 5) {
        filter.rating = ratingValue;
      }
    }

    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'highest':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sort = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sort = { helpful: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // For now, just use find instead of paginate
    const reviews = await Review.find(filter)
      .populate([
        { path: 'user', select: 'name' },
        { path: 'reply.admin', select: 'name' }
      ])
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalReviews = await Review.countDocuments(filter);

    res.json({
      success: true,
      reviews: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews: totalReviews,
        hasNextPage: parseInt(page) < Math.ceil(totalReviews / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching public product reviews:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch product reviews' 
    });
  }
};

// Placeholder functions for other exports (implement as needed)
exports.getProductReviews = exports.getPublicProductReviews;

// controllers/reviewController.js


exports.getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const [reviews, totalReviews] = await Promise.all([
      Review.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('product', 'name')
        .populate('user', 'name email'),
      Review.countDocuments()
    ]);

    const totalPages = Math.ceil(totalReviews / limit);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
      }
    });
  } catch (err) {
    console.error('❌ Error fetching all reviews:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: 'approved' },
      { new: true }
    )
    .populate('user', 'name email')  // optional
    .populate('product', 'name');    // optional

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review approved successfully',
      review
    });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Find and update the review status
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: 'rejected' },
      { new: true }
    )
    .populate('user', 'name email') // optional
    .populate('product', 'name');   // optional

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review rejected successfully',
      review
    });
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

exports.addReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.reply = {
      text,
      date: new Date()
    };

    await review.save();

    res.json({
      success: true,
      message: 'Reply added successfully',
      review
    });

  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ success: false, message: 'Server error while adding reply' });
  }
};


exports.markHelpful = async (req, res) => {
  res.json({ 
    success: true, 
    message: 'markHelpful - implement as needed' 
  });
};

exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const reviews = await Review.find({ user: userId })
      .populate([
        { path: 'product', select: 'name image price' }
      ])
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews: reviews,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user reviews' 
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Delete associated image files if they exist
    if (review.images && review.images.length > 0) {
      review.images.forEach((imgPath) => {
        const absolutePath = path.join(__dirname, '..', imgPath);
        fs.unlink(absolutePath, (err) => {
          if (err) {
            console.warn(`Failed to delete image ${imgPath}:`, err.message);
          }
        });
      });
    }

    // Delete the review document
    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: 'Review and associated images deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Add these functions to your reviewController.js

// Get all verified reviews (public endpoint)
exports.getVerifiedReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'newest',
      filterRating = 'all',
      productId = null // Optional: filter by specific product
    } = req.query;

    console.log('=== getVerifiedReviews Debug ===');
    console.log('Query params:', { page, limit, sortBy, filterRating, productId });

    const Review = require('../models/Review');

    // Build filter for verified reviews only
    const filter = {
      verified: true,
      status: 'approved' // Only show approved verified reviews
    };

    // Optionally filter by product
    if (productId) {
      filter.product = productId;
    }

    // Optional rating filter
    if (filterRating !== 'all') {
      const ratingValue = parseInt(filterRating);
      if (ratingValue >= 1 && ratingValue <= 5) {
        filter.rating = ratingValue;
      }
    }

    // Build sort options
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'highest':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sort = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sort = { helpful: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    console.log('Filter:', filter);
    console.log('Sort:', sort);

    // Try pagination if available
    let reviews;
    let pagination = {
      currentPage: parseInt(page),
      totalPages: 1,
      totalReviews: 0,
      hasNextPage: false,
      hasPrevPage: false
    };

    try {
      if (Review.paginate) {
        const options = {
          page: parseInt(page),
          limit: Math.min(parseInt(limit), 50),
          sort,
          populate: [
            { path: 'user', select: 'name email' },
            { path: 'product', select: 'name image price' },
            { path: 'reply.admin', select: 'name' }
          ]
        };

        const paginatedResult = await Review.paginate(filter, options);
        reviews = paginatedResult.docs;
        pagination = {
          currentPage: paginatedResult.page,
          totalPages: paginatedResult.totalPages,
          totalReviews: paginatedResult.totalDocs,
          hasNextPage: paginatedResult.hasNextPage,
          hasPrevPage: paginatedResult.hasPrevPage
        };
      } else {
        // Fallback without pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = Math.min(parseInt(limit), 50);

        reviews = await Review.find(filter)
          .populate([
            { path: 'user', select: 'name email' },
            { path: 'product', select: 'name image price' },
            { path: 'reply.admin', select: 'name' }
          ])
          .sort(sort)
          .skip(skip)
          .limit(limitNum);

        const totalReviews = await Review.countDocuments(filter);
        pagination = {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limitNum),
          totalReviews: totalReviews,
          hasNextPage: parseInt(page) < Math.ceil(totalReviews / limitNum),
          hasPrevPage: parseInt(page) > 1
        };
      }
    } catch (queryError) {
      console.error('Query error:', queryError);
      throw queryError;
    }

    console.log('Found verified reviews:', reviews.length);

    // Calculate statistics for verified reviews
    const verifiedStats = await Review.aggregate([
      {
        $match: { verified: true, status: 'approved' }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    let stats = {
      totalVerifiedReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (verifiedStats.length > 0) {
      const stat = verifiedStats[0];
      stats.totalVerifiedReviews = stat.totalReviews;
      stats.averageRating = parseFloat(stat.averageRating.toFixed(1));
      
      // Calculate rating distribution
      stat.ratingDistribution.forEach(rating => {
        stats.ratingDistribution[rating]++;
      });
    }

    console.log('Verified reviews stats:', stats);

    res.json({
      success: true,
      reviews: reviews || [],
      pagination,
      stats,
      message: `Found ${reviews.length} verified reviews`
    });

  } catch (error) {
    console.error('Error fetching verified reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verified reviews',
      details: error.message
    });
  }
};

// Get verified reviews for a specific product
exports.getVerifiedProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'newest',
      filterRating = 'all'
    } = req.query;

    console.log('=== getVerifiedProductReviews Debug ===');
    console.log('Product ID:', productId);

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }


    const filter = {
      product: productId,
      verified: true,
      status: 'approved'
    };

    if (filterRating !== 'all') {
      const ratingValue = parseInt(filterRating);
      if (ratingValue >= 1 && ratingValue <= 5) {
        filter.rating = ratingValue;
      }
    }

    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'highest':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sort = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sort = { helpful: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Get verified reviews for this product
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 50);

    const reviews = await Review.find(filter)
      .populate([
        { path: 'user', select: 'name' },
        { path: 'reply.admin', select: 'name' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments(filter);
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / limitNum),
      totalReviews: totalReviews,
      hasNextPage: parseInt(page) < Math.ceil(totalReviews / limitNum),
      hasPrevPage: parseInt(page) > 1
    };

    // Calculate verified rating stats for this product
    const productStats = await Review.aggregate([
      {
        $match: { 
          product: new (require('mongoose')).Types.ObjectId(productId),
          verified: true, 
          status: 'approved' 
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const ratingStats = {
      averageRating: 0,
      totalVerifiedReviews: totalReviews,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (productStats.length > 0) {
      let totalRating = 0;
      let totalCount = 0;

      productStats.forEach(stat => {
        ratingStats.ratingDistribution[stat._id] = stat.count;
        totalRating += stat._id * stat.count;
        totalCount += stat.count;
      });

      if (totalCount > 0) {
        ratingStats.averageRating = parseFloat((totalRating / totalCount).toFixed(1));
      }
    }

    console.log('Found verified product reviews:', reviews.length);

    res.json({
      success: true,
      reviews: reviews || [],
      pagination,
      ratingStats,
      message: `Found ${reviews.length} verified reviews for this product`
    });

  } catch (error) {
    console.error('Error fetching verified product reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verified product reviews',
      details: error.message
    });
  }
};

// Get count of verified reviews
exports.getVerifiedReviewsCount = async (req, res) => {
  try {
    const { productId } = req.query;

    const Review = require('../models/Review');

    const filter = {
      verified: true,
      status: 'approved'
    };

    if (productId) {
      filter.product = productId;
    }

    const count = await Review.countDocuments(filter);

    res.json({
      success: true,
      count,
      message: productId 
        ? `Found ${count} verified reviews for this product`
        : `Found ${count} total verified reviews`
    });

  } catch (error) {
    console.error('Error counting verified reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to count verified reviews',
      details: error.message
    });
  }
};