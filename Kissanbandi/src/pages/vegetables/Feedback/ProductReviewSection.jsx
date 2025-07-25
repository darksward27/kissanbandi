import React, { useState, useEffect } from 'react';
import {
  Star, User, ThumbsUp, ShoppingBag, CheckCircle, Filter, SortAsc, 
  Loader2, AlertCircle, Eye, ChevronLeft, ChevronRight, X, Edit3, ChevronDown,
  MessageSquare, Shield, Crown, Clock
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

  // Fixed API URL handling
  const getApiUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const nodeEnv = import.meta.env.VITE_NODE_ENV;
    
    if (nodeEnv === 'production') {
      return 'http://localhost:5000/api';
    }
    
    return apiUrl || 'http://localhost:5000/api';
  };

  // Helper function to construct proper image URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    const baseUrl = getApiUrl().replace('/api', '');
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it starts with /uploads, use it directly
    if (imagePath.startsWith('/uploads')) {
      return `${baseUrl}${imagePath}`;
    }
    
    // If it's just a filename, construct the full path
    const filename = imagePath.split('/').pop();
    return `${baseUrl}/uploads/reviews/${filename}`;
  };

  const fetchVerifiedReviews = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiUrl();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        filterRating
      });

      if (productId) {
        params.append('productId', productId);
      }

      // Build full URL correctly
      const endpoint = productId 
        ? `${API_BASE_URL}/reviews/verified/product/${productId}?${params}`
        : `${API_BASE_URL}/reviews/verified?${params}`;

      console.log('🔍 Fetching from:', endpoint);
      console.log('🌍 Environment:', import.meta.env.VITE_NODE_ENV);
      console.log('🔗 API Base URL:', API_BASE_URL);

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        throw new Error(`Failed to fetch verified reviews: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
        setStats(data.stats || data.ratingStats || null);
        
        if (data.pagination) {
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
        }
        console.log('✅ Reviews loaded successfully:', data.reviews?.length || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch verified reviews');
      }
    } catch (err) {
      console.error('💥 Error fetching verified reviews:', err);
      setError(err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifiedReviews(1);
  }, [productId, sortBy, filterRating]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchVerifiedReviews(currentPage);
    }
  }, [currentPage]);

  const openImageModal = (images, startIndex = 0) => {
    // Process images to ensure proper URLs
    const processedImages = images.map(img => getImageUrl(img)).filter(Boolean);
    setSelectedImages(processedImages);
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

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return formatDate(dateString);
    }
  };

  const handleWriteReview = () => {
    window.location.href = '/write-review';
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Enhanced Admin Reply Component
  const AdminReply = ({ reply }) => {
  if (!reply || !reply.text) return null;

  return (
    <div className="mt-4 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-r-lg shadow-sm">
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-2 flex-shrink-0 shadow-sm">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Crown className="w-4 h-4 text-blue-600" />
              <h6 className="font-semibold text-blue-900">Store Administrator</h6>
            </div>
            <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
              Official Response
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed mb-3">{reply.text}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-blue-600 font-medium">
                {reply.date ? formatRelativeTime(reply.date) : 'Recently'}
              </span>
            </div>
            {reply.adminName && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">by {reply.adminName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
            <p className="text-sm text-gray-500 mb-4">
              API URL: {getApiUrl()}
            </p>
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
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <div className="relative">
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white cursor-pointer"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              <Filter className="w-4 h-4 text-amber-600 absolute left-3 top-3 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-amber-600 absolute right-2 top-3 pointer-events-none" />
            </div>
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
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {review.user?.name || 'Anonymous User'}
                    </h4>
                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified Purchase
                    </span>
                    {review.reply && review.reply.message && (
                      <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                        <MessageSquare className="w-3 h-3" />
                        Store Replied
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500 font-medium">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

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
                      const processedImageUrl = getImageUrl(imageUrl);
                      
                      if (!processedImageUrl) {
                        return null;
                      }

                      return (
                        <div
                          key={idx}
                          className="relative group cursor-pointer w-24 h-24"
                          onClick={() => openImageModal(review.images, idx)}
                        >
                          <img
                            src={processedImageUrl}
                            alt={`Review image ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border border-amber-200 hover:opacity-80 transition-opacity"
                            onError={(e) => {
                              console.error('Image failed to load:', processedImageUrl);
                              // Fallback to placeholder
                              e.target.src = `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop`;
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', processedImageUrl);
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

              {/* Enhanced Admin Reply Section */}
              <AdminReply reply={review.reply} />

              {/* Review Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors text-sm font-medium">
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpful || 0})
                  </button>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Verified Purchase
                  </span>
                  {review.reply && review.reply.message && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Store Responded
                    </span>
                  )}
                </div>
              </div>
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
      {imageModalOpen && selectedImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-4xl w-full h-full p-4">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>

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

            <div className="w-full h-full flex items-center justify-center">
              <img
                src={selectedImages[currentImageIndex]}
                alt={`Review image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  console.error('Modal image failed to load:', selectedImages[currentImageIndex]);
                  e.target.src = `https://via.placeholder.com/600x400/d4a574/ffffff?text=Image+Not+Found`;
                }}
                onLoad={() => {
                  console.log('Modal image loaded successfully:', selectedImages[currentImageIndex]);
                }}
              />
            </div>

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