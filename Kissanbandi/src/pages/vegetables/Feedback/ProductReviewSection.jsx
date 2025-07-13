import React, { useState, useEffect } from 'react';
import {
  Star, User, ThumbsUp, ShoppingBag, CheckCircle, Filter, SortAsc, 
  Loader2, AlertCircle, Eye, ChevronLeft, ChevronRight, X, Edit3
} from 'lucide-react';

const VerifiedReviewsSection = ({ productId = null, showProductInfo = false }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch verified reviews
  const fetchVerifiedReviews = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        filterRating
      });

      if (productId) {
        params.append('productId', productId);
      }

      // Choose endpoint based on whether we want all verified or product-specific
      const endpoint = productId 
        ? `/api/reviews/verified/product/${productId}?${params}`
        : `/api/reviews/verified?${params}`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch verified reviews: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
        setStats(data.stats || data.ratingStats || null);
        
        if (data.pagination) {
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch verified reviews');
      }
    } catch (err) {
      console.error('Error fetching verified reviews:', err);
      setError(err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Image modal functions
  const openImageModal = (images, startIndex = 0) => {
    setSelectedImages(images);
    setCurrentImageIndex(startIndex);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === selectedImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? selectedImages.length - 1 : prev - 1
    );
  };

  // Handle write review redirect
  const handleWriteReview = () => {
    window.location.href = '/write-review';
  };

  // Load reviews when component mounts or filters change
  useEffect(() => {
    fetchVerifiedReviews(1);
  }, [productId, sortBy, filterRating]);

  // Load different page
  useEffect(() => {
    if (currentPage > 1) {
      fetchVerifiedReviews(currentPage);
    }
  }, [currentPage]);

  const renderStars = (rating, size = 'w-5 h-5') => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 rounded-xl border border-amber-200">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <span className="ml-2 text-amber-700">Loading verified reviews...</span>
        </div>
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 rounded-xl border border-amber-200">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Verified Reviews</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchVerifiedReviews(currentPage)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 rounded-xl border border-amber-200 shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 rounded-full p-2">
              <CheckCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {productId ? 'Verified Product Reviews' : 'All Verified Reviews'}
            </h2>
          </div>
          
          {/* Write Review Button */}
          <button
            onClick={handleWriteReview}
            className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            <Edit3 className="w-5 h-5" />
            Write a Review
          </button>
        </div>
        
        <p className="text-gray-600">
          Reviews from customers who have purchased and verified their experience
        </p>
        
        {stats && (
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-amber-600">
                {stats.averageRating || stats.averageRating === 0 ? stats.averageRating : 'N/A'}
              </span>
              {stats.averageRating && renderStars(stats.averageRating, 'w-5 h-5')}
            </div>
            <div className="text-sm text-gray-600">
              <strong>{stats.totalVerifiedReviews || stats.totalReviews || 0}</strong> verified reviews
            </div>
          </div>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-amber-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <SortAsc className="w-5 h-5 text-amber-600" />
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-600" />
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            <span className="ml-2 text-amber-700">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-amber-200">
            <CheckCircle className="w-20 h-20 text-amber-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Verified Reviews Yet</h3>
            <p className="text-gray-600 mb-6">
              {productId 
                ? 'This product has no verified reviews yet.'
                : 'No verified reviews found matching your criteria.'
              }
            </p>
            <button
              onClick={handleWriteReview}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Be the First to Write a Review
            </button>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-xl border border-amber-200 p-6 shadow-md hover:shadow-lg transition-shadow">
              {/* Review Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-full p-3 flex-shrink-0">
                  <User className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {review.user?.name || 'Anonymous User'}
                    </h4>
                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500 font-medium">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Info (if showing all verified reviews) */}
              {showProductInfo && review.product && (
                <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-200">
                  <div className="flex items-center gap-3">
                    {review.product.image && (
                      <img 
                        src={review.product.image.startsWith('http') ? review.product.image : 
                              review.product.image.startsWith('/') ? review.product.image : 
                              `/uploads/products/${review.product.image}`}
                        alt={review.product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x100/d4a574/ffffff?text=Product';
                        }}
                      />
                    )}
                    <div>
                      <h5 className="font-medium text-gray-900">{review.product.name}</h5>
                      {review.product.price && (
                        <span className="text-sm text-gray-600">${review.product.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Review Title */}
              {review.title && (
                <h5 className="font-semibold text-gray-900 text-lg mb-3">{review.title}</h5>
              )}

              {/* Review Content */}
              <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Photos from this review:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {review.images.map((imageUrl, idx) => {
                      // Get the filename from the database path
                      const filename = imageUrl.split('/').pop();
                      
                      // Try different server configurations for backend images
                      const possiblePaths = [
                        `http://localhost:5000${imageUrl}`, // Backend server with original path
                        `http://localhost:5000/uploads/reviews/${filename}`, // Backend with direct path
                        `http://localhost:3000${imageUrl}`, // Alternative backend port
                        `http://localhost:3000/uploads/reviews/${filename}`, // Alternative port with direct path
                        `/api/uploads/reviews/${filename}`, // API proxy route
                        imageUrl, // Original path (frontend serving)
                        // Brown-themed fallback
                        `https://via.placeholder.com/200x200/8B4513/ffffff?text=Review+Photo`
                      ];

                      return (
                        <div
                          key={idx}
className="relative group cursor-pointer w-24 h-24"                          onClick={() => openImageModal(review.images, idx)}
                        >
                          <img
                            src={possiblePaths[0]}
                            alt={`Review image ${idx + 1}`}
className="w-24 h-24 object-cover rounded-lg border border-amber-200 hover:opacity-80 transition-opacity"
                            onError={(e) => {
                              const img = e.target;
                              const currentSrc = img.src;
                              const currentIndex = possiblePaths.findIndex(path => 
                                currentSrc.includes(path) || currentSrc === path
                              );
                              
                              if (currentIndex >= 0 && currentIndex < possiblePaths.length - 1) {
                                const nextPath = possiblePaths[currentIndex + 1];
                                console.log(`Trying path ${currentIndex + 2}/${possiblePaths.length}:`, nextPath);
                                img.src = nextPath;
                              }
                            }}
                            onLoad={(e) => {
                              console.log(`✅ Image loaded from:`, e.target.src);
                            }}
                          />
                          
                          <div className="absolute top-1 left-1 bg-amber-600 text-white text-xs px-1 rounded">
                            {idx + 1}
                          </div>
                          
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                 
                </div>
              )}

              {/* Review Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors text-sm font-medium">
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpful || 0})
                  </button>
                </div>
                
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  Verified Purchase
                </span>
              </div>

              {/* Admin Reply */}
              {review.reply && (
                <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">S</span>
                    </div>
                    <span className="font-semibold text-amber-900">Store Response</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.reply.date)}
                    </span>
                  </div>
                  <p className="text-gray-700 pl-8">{review.reply.text}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-amber-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors"
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-amber-600 text-white'
                    : 'border border-amber-200 hover:bg-amber-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-amber-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Image Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-4xl w-full h-full p-4">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>

            {/* Navigation Buttons */}
            {selectedImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}

            {/* Image */}
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={selectedImages[currentImageIndex]}
                alt={`Review image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  console.log('Modal image failed to load:', selectedImages[currentImageIndex]);
                  e.target.src = 'https://via.placeholder.com/600x400/d4a574/ffffff?text=Image+Not+Found';
                }}
              />
            </div>

            {/* Image Counter */}
            {selectedImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} of {selectedImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifiedReviewsSection;