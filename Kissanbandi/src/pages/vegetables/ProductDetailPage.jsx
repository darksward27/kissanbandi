// Updated ProductDetailPage.js with enhanced cart synchronization and fixed image handling
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart, Star, ShoppingCart, ArrowLeft, Share2, Package, 
  Truck, Shield, RotateCcw, Check, Plus, Minus,
  ChevronLeft, ChevronRight, MessageSquare, ThumbsUp, 
  Calendar, User, CheckCircle, Send
} from 'lucide-react';
import { useCart } from "../checkout/CartContext";
import { useAuth } from '../checkout/AuthProvider';
import { toast } from 'react-hot-toast';
import { usersApi, productsApi } from '../../services/api';
import { Link } from 'react-router-dom';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Enhanced cart integration with real-time sync
  const { 
    state: cartState,
    getItemQuantity, 
    addSingleItem, 
    removeSingleItem, 
    updateQuantity,
    isInCart,
    getTotalItems,
    getCartTotal,
    cartStats
  } = useCart();
  
  const auth = useAuth();
  const isAuthenticated = auth?.user && !auth?.loading;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current quantity from cart - this will sync automatically
  const cartQuantity = getItemQuantity(id);
  // For display when item is not in cart yet
  const [displayQuantity, setDisplayQuantity] = useState(0);

  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [activeTab, setActiveTab] = useState('description');
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: []
  });

  // ✅ FIXED: Image handling functions
  const getProductImage = (imagePath) => {
    if (!imagePath) {
      return '/api/placeholder/500/500';
    }

    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it starts with /uploads, use it directly with your backend
    if (imagePath.startsWith('/uploads')) {
      return `https://bogat.onrender.com${imagePath}`;
    }
    
    // If it's just a filename, put it in product folder
    const filename = imagePath.split('/').pop();
    return `https://bogat.onrender.com/uploads/product/${filename}`;
  };

  // ✅ FIXED: Enhanced getProductImages function
  const getProductImages = () => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      // Process each image URL
      return product.images.map(img => getProductImage(img));
    }
    
    // Fallback to single image field
    if (product?.image) {
      return [getProductImage(product.image)];
    }
    
    // Default placeholder
    return ['/api/placeholder/500/500'];
  };

  // ✅ FIXED: Enhanced getRelatedProductImage function
  const getRelatedProductImage = (relatedProduct) => {
    if (relatedProduct.images && Array.isArray(relatedProduct.images) && relatedProduct.images.length > 0) {
      return getProductImage(relatedProduct.images[0]);
    }
    
    if (relatedProduct.image) {
      return getProductImage(relatedProduct.image);
    }
    
    return '/api/placeholder/300/200';
  };

  // Debug function for ProductDetailPage
  const debugProductImages = () => {
    console.log('=== PRODUCT DETAIL IMAGES DEBUG ===');
    console.log('Product:', product?.name);
    console.log('Product images array:', product?.images);
    console.log('Product single image:', product?.image);
    console.log('Processed images:', getProductImages());
    console.log('Current selected image:', selectedImage);
    console.log('Selected image URL:', getProductImages()[selectedImage]);
    console.log('=== END DEBUG ===');
  };

  // Real-time cart sync effect
  useEffect(() => {
    // Update display quantity when cart changes
    if (cartQuantity > 0) {
      setDisplayQuantity(cartQuantity);
    } else {
      setDisplayQuantity(0);
    }
  }, [cartQuantity, cartState.lastUpdated]);

  // Load product data
  useEffect(() => {
    if (id) {
      loadProduct();
      loadRelatedProducts();
      loadProductReviews();
      if (isAuthenticated) {
        checkCanReview();
      }
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && product) {
      checkWishlistStatus();
    }
  }, [isAuthenticated, product]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await productsApi.getProductById(id);
      
      if (data && (data._id || data.id)) {
        setProduct(data);
      } else {
        throw new Error('Product not found');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    try {
      const data = await productsApi.getAllProducts();
      let allProducts = Array.isArray(data) ? data : (data.products || data.data || []);
      
      const filtered = allProducts
        .filter(p => (p._id || p.id) !== id && p.status !== 'inactive')
        .slice(0, 4);
      
      setRelatedProducts(filtered);
    } catch (err) {
      console.error('Error loading related products:', err);
    }
  };

  const loadProductReviews = async () => {
    try {
      setReviewsLoading(true);
      
      const reviewsResponse = await fetch(`${import.meta.env.VITE_API_URL}/reviews/verified/product/${id}`);
      const reviewsData = await reviewsResponse.json();
      
      if (reviewsResponse.ok && reviewsData.success) {
        const reviewsList = reviewsData.reviews || [];
        setReviews(reviewsList);
        
        const totalReviews = reviewsList.length;
        if (totalReviews > 0) {
          const ratings = reviewsList.map(r => r.rating);
          const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews;
          
          const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          ratings.forEach(rating => {
            breakdown[rating] = (breakdown[rating] || 0) + 1;
          });
          
          setReviewStats({
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            ratingBreakdown: breakdown
          });
        } else {
          setReviewStats({
            averageRating: 0,
            totalReviews: 0,
            ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          });
        }
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
      setReviewStats({
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkCanReview = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews/can-review/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kissanbandi_token') || sessionStorage.getItem('kissanbandi_token')}`
        }
      });
      const data = await response.json();
      setCanReview(data.success && data.canReview);
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const wishlistItems = await usersApi.getWishlist();
      const isInList = wishlistItems.some(item => (item._id || item.id) === (product._id || product.id));
      setIsInWishlist(isInList);
    } catch (err) {
      console.error('Failed to check wishlist status:', err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('productId', id);
      formData.append('rating', reviewForm.rating);
      formData.append('title', reviewForm.title);
      formData.append('comment', reviewForm.comment);
      
      reviewForm.images.forEach((image, index) => {
        formData.append('images', image);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kissanbandi_token') || sessionStorage.getItem('kissanbandi_token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Review submitted successfully! It will be visible after approval.');
        setShowReviewForm(false);
        setReviewForm({ rating: 5, title: '', comment: '', images: [] });
        setCanReview(false);
        loadProductReviews();
      } else {
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error(err.message || 'Failed to submit review');
    }
  };

  const handleAddSingleItem = async () => {
    if (!product) {
      console.error('❌ No product available');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (product.stock === 0) {
      toast.error('Sorry, this product is out of stock!');
      return;
    }

    const maxStock = product?.stock || 10;
    
    if (cartQuantity >= maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
      return;
    }

    // Validate price before proceeding
    if (product.price === undefined || product.price === null || product.price === '') {
      console.error('❌ Product has no price!');
      toast.error('Product price not available');
      return;
    }

    const productPrice = Number(product.price);
    if (isNaN(productPrice) || productPrice <= 0) {
      console.error('❌ Invalid product price:', product.price, '→', productPrice);
      toast.error('Invalid product price');
      return;
    }

    try {
      // Create complete product object ensuring ALL fields are preserved
      const completeProduct = {
        ...product,
        id: product._id || product.id,
        _id: product._id || product.id,
        name: product.name || 'Unknown Product',
        price: productPrice,
        image: getProductImages()[0], // Use processed image
        stock: product.stock || 999,
        category: product.category,
        brand: product.brand,
        description: product.description,
        originalPrice: product.originalPrice,
        unit: product.unit,
        images: getProductImages(), // Use processed images
        status: product.status
      };

      const success = addSingleItem(completeProduct);
      
      if (success) {
        toast.success(`Added ${product.name} to cart!`);
      } else {
        console.error('❌ addSingleItem returned false');
        toast.error('Failed to add item to cart');
      }
      
    } catch (err) {
      console.error('❌ Exception in handleAddSingleItem:', err);
      toast.error('Failed to add to cart');
    }
  };

  const handleRemoveSingleItem = async () => {
    if (!product) return;
    
    if (!isAuthenticated) {
      toast.error('Please login to manage cart items');
      navigate('/login');
      return;
    }

    const productId = product._id || product.id;
    const currentCartQuantity = getItemQuantity(productId);

    if (currentCartQuantity <= 0) {
      toast.error('Item not in cart');
      return;
    }

    try {
      const success = removeSingleItem(productId);
      if (success) {
        toast.success(`Removed one ${product.name} from cart!`);
      }
    } catch (err) {
      console.error('Cart error:', err);
      toast.error('Failed to remove from cart');
    }
  };

  const handleQuantityChange = (change) => {
    const productId = product._id || product.id;
    const maxStock = product?.stock || 10;

    if (cartQuantity > 0) {
      // Item is in cart
      const newQuantity = cartQuantity + change;

      if (newQuantity >= 1 && newQuantity <= maxStock) {
        updateQuantity(productId, newQuantity);
      } else if (newQuantity > maxStock) {
        toast.error(`Only ${maxStock} items available in stock`);
      } else if (newQuantity <= 0) {
        updateQuantity(productId, 0);
      }
    } else {
      // Item not in cart, update local display
      const newQuantity = displayQuantity + change;

      if (newQuantity >= 0 && newQuantity <= maxStock) {
        setDisplayQuantity(newQuantity);
      } else if (newQuantity > maxStock) {
        toast.error(`Only ${maxStock} items available in stock`);
      } else if (newQuantity < 0) {
        setDisplayQuantity(0);
      }
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }

    try {
      if (isInWishlist) {
        await usersApi.removeFromWishlist(product._id || product.id);
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await usersApi.addToWishlist(product._id || product.id);
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Product link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const isOutOfStock = product?.stock === 0;
  const isUnavailable = product?.status === 'inactive';
  const canPurchase = !isOutOfStock && !isUnavailable;

  // Get the current quantity to display (from cart if in cart, otherwise display quantity)
  const currentQuantity = cartQuantity > 0 ? cartQuantity : displayQuantity;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-gray-200 h-96 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="text-red-500 mb-4">
                <Package className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Product Not Found</h2>
                <p className="text-gray-600 mt-2">{error}</p>
              </div>
              <button 
                onClick={() => navigate('/products')}
                className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-amber-700 hover:to-orange-800 transition-all duration-300"
              >
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = getProductImages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Temporary Debug Button */}
       

        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/products')}
              className="flex items-center text-gray-600 hover:text-amber-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Products
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-medium">{product.name}</span>
          </div>
          
          {/* Real-time cart status in header */}
          {getTotalItems() > 0 && (
            <div className="flex items-center space-x-4">
              <Link 
                to="/checkout" 
                className="flex items-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({getTotalItems()}) • ₹{getCartTotal().toFixed(2)}
              </Link>
            </div>
          )}
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden group">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  console.error('❌ Product image failed to load:', e.target.src);
                  e.target.src = '/api/placeholder/500/500';
                }}
                onLoad={() => {
                  console.log('✅ Product image loaded successfully:', images[selectedImage]);
                }}
              />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Status Badges */}
              {isUnavailable && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Unavailable
                </div>
              )}
              {isOutOfStock && !isUnavailable && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Out of Stock
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-amber-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Thumbnail failed to load:', e.target.src);
                        e.target.src = '/api/placeholder/100/100';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  {product.brand && (
                    <p className="text-amber-600 font-medium">by {product.brand}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleShare}
                    className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={toggleWishlist}
                    className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                  </button>
                </div>
              </div>

              {/* Rating & Reviews */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {renderStars(Math.round(reviewStats.averageRating))}
                  <span className="text-sm text-gray-600 ml-2">
                    {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews} reviews)
                  </span>
                </div>
                {product.category && (
                  <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold text-amber-700">
                    ₹{product.price?.toLocaleString() || '0'}
                    {product.unit && <span className="text-lg text-gray-600">/{product.unit}</span>}
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                      <span className="text-green-600 font-medium">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% off
                      </span>
                    </div>
                  )}
                </div>
                {canPurchase && (
                  <div className="text-green-600 font-medium flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    In Stock ({product.stock || 0})
                  </div>
                )}
              </div>

              {/* Enhanced Quantity Selector with Real-time Cart Integration */}
              {canPurchase && (
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-gray-700 font-medium">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={currentQuantity <= 0}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                      {currentQuantity}
                    </span>
                   <button
  onClick={() => handleQuantityChange(1)}
  disabled={
    currentQuantity >= (product.stock || 0) || currentQuantity === 0
  }
  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  <Plus className="w-4 h-4" />
</button>
                  </div>
                  
                  {/* Enhanced cart status with real-time updates */}
                  <div className="flex flex-col space-y-1">
                    {cartQuantity > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600 font-medium">
                          ✓ {cartQuantity} in cart
                        </span>
                      </div>
                    )}
                    {getTotalItems() > 0 && (
                      <div className="text-xs text-gray-500">
                        Cart total: {getTotalItems()} items • ₹{getCartTotal().toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {canPurchase ? (
                  <>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleAddSingleItem}
                        disabled={addingToCart || cartQuantity >= (product.stock || 10)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add One</span>
                      </button>
                    </div>
                    <Link to="/checkout" className="w-full block">
                      <button 
                        disabled={getTotalItems() === 0}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {getTotalItems() > 0 ? 'Buy Now' : 'Add items to buy'}
                      </button>
                    </Link>
                  </>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-xl font-medium text-center">
                    {isUnavailable ? 'Product Unavailable' : 'Out of Stock'}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4">Delivery & Services</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Free delivery on orders above ₹500</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Delivery in 2-3 business days</span>
                </div>
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5 text-purple-600" />
                  <span className="text-sm">7 days return policy</span>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct._id || relatedProduct.id}
                  onClick={() => navigate(`/products/${relatedProduct._id || relatedProduct.id}`)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  <img
                    src={getRelatedProductImage(relatedProduct)}
                    alt={relatedProduct.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.error('❌ Related product image failed:', e.target.src);
                      e.target.src = '/api/placeholder/300/200';
                    }}
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{relatedProduct.name}</h3>
                    <div className="text-xl font-bold text-amber-700">
                      ₹{relatedProduct.price?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-16">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'description'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reviews ({reviewStats.totalReviews})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h2>

                {product.description ? (
                  <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                    {product.description.split('.').map((point, idx) => {
                      const trimmed = point.trim();
                      return trimmed ? <li key={idx}>{trimmed}.</li> : null;
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-600">No description available for this product.</p>
                )}
              </div>
            )}

           {activeTab === 'reviews' && (
              <div className="space-y-6">
                <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Write a Review
                      </button>
                {/* Reviews Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                 
                </div>

                {/* Review Summary */}
                {reviewStats.totalReviews > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-amber-600 mb-2">
                          {reviewStats.averageRating.toFixed(1)}
                        </div>
                        <div className="flex justify-center mb-2">
                          {renderStars(Math.round(reviewStats.averageRating), 'w-5 h-5')}
                        </div>
                        <div className="text-gray-600">
                          Based on {reviewStats.totalReviews} reviews
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => (
                          <div key={rating} className="flex items-center space-x-2">
                            <span className="text-sm font-medium w-8">{rating}</span>
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{
                                  width: `${reviewStats.totalReviews > 0 
                                    ? (reviewStats.ratingBreakdown[rating] / reviewStats.totalReviews) * 100 
                                    : 0}%`
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">
                              {reviewStats.ratingBreakdown[rating]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating *
                        </label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  rating <= reviewForm.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Review Title *
                        </label>
                        <input
                          type="text"
                          value={reviewForm.title}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="Summarize your review"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Review *
                        </label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          rows="4"
                          placeholder="Share your experience with this product"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Photos (Optional)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => setReviewForm(prev => ({ ...prev, images: Array.from(e.target.files) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">You can upload up to 5 images</p>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Submit Review
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviewsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading reviews...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {review.user?.name || 'Anonymous User'}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <div className="flex">
                                    {renderStars(review.rating)}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                  {review.verified && (
                                    <div className="flex items-center text-green-600">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      <span className="text-xs">Verified Purchase</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                            <p className="text-gray-600 mb-3">{review.comment}</p>
                            
                            {/* Review Images */}
                            {review.images && review.images.length > 0 && (
                              <div className="flex space-x-2 mb-3">
                                {review.images.slice(0, 3).map((image, index) => (
                                  <img
                                    key={index}
                                    src={image}
                                    alt={`Review image ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ))}
                                {review.images.length > 3 && (
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                                    +{review.images.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Admin Reply */}
                            {review.adminReply && (
                              <div className="bg-blue-50 rounded-lg p-3 mt-3">
                                <div className="flex items-center mb-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                    <Shield className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <span className="text-sm font-medium text-blue-800">Store Response</span>
                                </div>
                                <p className="text-blue-700 text-sm">{review.adminReply}</p>
                              </div>
                            )}
                            
                            {/* Helpful Button */}
                            <div className="flex items-center space-x-4 mt-3">
                              <button className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                <span className="text-sm">
                                  Helpful ({review.helpfulCount || 0})
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                      <p className="text-gray-600">Be the first to review this product!</p>
                      {canReview && (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Write First Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;