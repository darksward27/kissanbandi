const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('Loading enhanced upload middleware...');

// Ensure uploads directories exist
const blogUploadDir = path.join(__dirname, '../uploads/blog');
const reviewUploadDir = path.join(__dirname, '../uploads/reviews');

[blogUploadDir, reviewUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created directory:', dir);
  }
});

// Blog storage config (your existing config)
const blogStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, blogUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Review storage config
const reviewStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, reviewUploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user?.userId || req.user?._id || 'anonymous';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `review-${timestamp}-${userId}${extension}`;
    cb(null, filename);
  }
});

// File filter for images (shared)
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP, and GIF files are allowed'), false);
  }
};

// Blog upload instance (your existing functionality)
const blogUpload = multer({
  storage: blogStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Review upload instance
const reviewUpload = multer({
  storage: reviewStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Maximum 5 files per review
  }
});

// Middleware for handling multiple review images
const uploadReviewImages = reviewUpload.array('images', 5);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  console.log('Upload error handler called:', err?.message);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB per image.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 5 images allowed per review.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  next();
};

// Cleanup function to delete uploaded files
const cleanupFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Cleaned up file:', filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', filePath, error);
    }
  });
};

console.log('Upload middleware loaded successfully');
console.log('Available exports:');
console.log('- blogUpload (default export):', typeof blogUpload);
console.log('- uploadReviewImages:', typeof uploadReviewImages);
console.log('- handleUploadError:', typeof handleUploadError);
console.log('- cleanupFiles:', typeof cleanupFiles);

// Export both old and new functionality
module.exports = blogUpload; // Default export (for existing blog functionality)

// Named exports for review functionality
module.exports.uploadReviewImages = uploadReviewImages;
module.exports.handleUploadError = handleUploadError;
module.exports.cleanupFiles = cleanupFiles;
module.exports.blogUpload = blogUpload;