import React, { useState, useEffect } from 'react';
import {
  Heart, Star, ShoppingCart, Sparkles, Lock, Package, TrendingUp
} from 'lucide-react';
import { useCart } from "../checkout/CartContext";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../checkout/AuthProvider';
import { toast } from 'react-hot-toast';
import { usersApi, productsApi } from '../../services/api';

const BogatProducts = () => {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth context
  const auth = useAuth();
  const isAuthenticated = auth?.user && !auth?.loading;

  const navigate = useNavigate();
  const { dispatch } = useCart();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    window.scrollTo({ top: 0 });
    
    loadProducts();
    
    // Only load wishlist if user is authenticated
    if (isAuthenticated) {
      loadWishlist();
    }

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, [isAuthenticated]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getAllProducts();
      let allProducts = Array.isArray(data) ? data : [];

      // Filter for bogat products - looking for "bogat" in various fields
      allProducts = allProducts.filter(product => {
        const productName = product?.name?.toLowerCase() || '';
        const productCategory = product?.category?.toLowerCase() || '';
        const productSubcategory = product?.subcategory?.toLowerCase() || '';
        const productDescription = product?.description?.toLowerCase() || '';
        const productBrand = product?.brand?.toLowerCase() || '';
        const productTags = product?.tags?.join(' ').toLowerCase() || '';
        
        // Check if "bogat" appears in any relevant field
        const isBogatProduct = 
          productName.includes('bogat') ||
          productCategory.includes('bogat') ||
          productSubcategory.includes('bogat') ||
          productDescription.includes('bogat') ||
          productBrand.includes('bogat') ||
          productTags.includes('bogat');
        
        const isActive = product?.status === 'active';
        
        console.log('Product:', product.name, {
          name: productName,
          category: productCategory,
          subcategory: productSubcategory,
          brand: productBrand,
          status: product?.status,
          isBogatProduct,
          isActive
        });
        
        return isBogatProduct && isActive;
      });

      // If no products found with "bogat" filter, show all active products as fallback
      if (allProducts.length === 0) {
        console.log('No bogat products found, showing all active products');
        allProducts = Array.isArray(data) ? data.filter(product => product?.status === 'active') : [];
      }

      console.log('Filtered bogat products:', allProducts.length);
      setProducts(allProducts);
    } catch (err) {
      setError(err.message);
      setProducts([]);
      setTimeout(() => toast.error('Failed to load products'), 0);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const wishlistItems = await usersApi.getWishlist();
      const ids = wishlistItems.map(item => item._id || item.id);
      setWishlist(new Set(ids));
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    }
  };

  // Check product availability
  const getProductStatus = (product) => {
    if (product?.status === 'inactive') {
      return { type: 'unavailable', message: 'Product is unavailable' };
    }
    if (product?.stock === 0) {
      return { type: 'out-of-stock', message: 'Out of stock' };
    }
    return { type: 'available', message: 'Available' };
  };

  const handleAddToCart = (product) => {
    if (!product) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    // Check product availability
    const productStatus = getProductStatus(product);
    if (productStatus.type !== 'available') {
      toast.error(`Sorry, ${productStatus.message.toLowerCase()}!`);
      return;
    }
    
    dispatch({ type: 'ADD_TO_CART', payload: product });
    setTimeout(() => toast.success(`Added ${product.name} to cart!`), 0);
  };

  const toggleWishlist = async (productId) => {
    if (!productId) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }

    try {
      const newWishlist = new Set(wishlist);

      if (newWishlist.has(productId)) {
        await usersApi.removeFromWishlist(productId);
        newWishlist.delete(productId);
        toast.success('Removed from wishlist');
      } else {
        await usersApi.addToWishlist(productId);
        newWishlist.add(productId);
        toast.success('Added to wishlist');
      }

      setWishlist(newWishlist);
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleRetry = () => {
    loadProducts();
  };

  // Show login prompt for restricted actions
  const showLoginPrompt = () => {
    toast.error('Please login to continue');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent absolute top-0 left-0"></div>
              <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-700 w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
            <div className="text-red-500 mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-lg font-semibold">{error}</p>
            </div>
            <button 
              onClick={handleRetry}
              className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-amber-700 hover:to-orange-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Login Status Banner */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                🔒 Please 
                <button 
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline mx-1"
                >
                  login
                </button>
                to add items to cart and wishlist
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-amber-300 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -top-2 -right-2 w-16 h-16 bg-orange-300 rounded-full opacity-30 animate-pulse delay-300"></div>
            <div className="flex items-center space-x-3 relative z-10">
              <Package className="w-12 h-12 text-amber-700" />
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                  Bogat Products
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Premium Quality Bogat Products delivered to your doorstep
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center mt-6 md:mt-0 bg-white px-6 py-3 rounded-full shadow-lg border border-amber-200">
            <TrendingUp className="w-5 h-5 text-amber-600 mr-2 animate-pulse" />
            <span className="text-gray-700 font-medium">
              {products.length} Bogat Products Available
            </span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {products.map((product) => {
            const productStatus = getProductStatus(product);
            const isUnavailable = productStatus.type !== 'available';
            
            return (
              <div 
                key={product._id || product.id} 
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 group border border-gray-200 hover:border-gray-300 transform hover:-translate-y-2 flex flex-col h-full ${
                  isUnavailable ? 'opacity-75' : ''
                }`}
              >
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full h-48 object-contain transform group-hover:scale-110 transition-transform duration-500 p-4 ${
                      isUnavailable ? 'filter grayscale' : ''
                    }`}
                  />
                  
                  <button 
                    onClick={() => isAuthenticated ? toggleWishlist(product._id || product.id) : showLoginPrompt()}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 border border-gray-200"
                  >
                    {!isAuthenticated ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Heart 
                        className={`w-5 h-5 transition-all duration-300 ${
                          wishlist.has(product._id || product.id) 
                            ? 'text-red-500 fill-current animate-pulse' 
                            : 'text-gray-600 hover:text-red-400'
                        }`} 
                      />
                    )}
                  </button>
                  
                  {/* Status Badge */}
                  {productStatus.type === 'unavailable' ? (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      🚫 Unavailable
                    </div>
                  ) : productStatus.type === 'out-of-stock' && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ❌ Out of Stock
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 transition-colors duration-300">
                    {product.name}
                  </h3>

                  {/* Category & Brand */}
                  <div className="flex items-center mb-3">
                    {product.category && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md mr-2">
                        {product.category}
                      </span>
                    )}
                    {product.brand && (
                      <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                        {product.brand}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  

                  {/* Description */}
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                      {product.description}
                    </p>
                  )}

                  <div className="flex justify-between items-end mt-auto">
                    <div className="flex flex-col">
                      <div className={`text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent ${
                        isUnavailable ? 'opacity-50' : ''
                      }`}>
                        ₹{product.price}
                      </div>
                      {product.unit && (
                        <span className="text-sm text-gray-600 font-normal">
                          /{product.unit}
                        </span>
                      )}
                      {productStatus.type === 'available' && product.stock && (
                        <span className="text-xs text-amber-700 font-medium mt-1">
                          {product.stock} in stock
                        </span>
                      )}
                    </div>
                    
                    {productStatus.type === 'unavailable' ? (
                      <div className="text-gray-500 font-semibold text-sm px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                        Unavailable
                      </div>
                    ) : productStatus.type === 'out-of-stock' ? (
                      <div className="text-red-500 font-semibold text-sm px-4 py-2 bg-red-50 rounded-xl border border-red-200">
                        Out of Stock
                      </div>
                    ) : !isAuthenticated ? (
                      <button 
                        onClick={showLoginPrompt}
                        className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-2 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center group/btn font-medium text-sm whitespace-nowrap"
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Login to Add
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-4 py-2 rounded-xl hover:from-amber-700 hover:to-orange-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center group/btn font-medium text-sm whitespace-nowrap"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1 group-hover/btn:animate-bounce" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>

                {/* Animated border effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none ${
                  productStatus.type === 'unavailable' 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
                    : productStatus.type === 'out-of-stock'
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}></div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto border border-amber-200">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No Bogat Products Found
              </h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any Bogat products at the moment.
              </p>
              <button 
                onClick={handleRetry}
                className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-amber-700 hover:to-orange-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Refresh Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BogatProducts;