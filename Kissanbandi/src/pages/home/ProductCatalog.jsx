import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, ChevronDown, Star, Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { useCart } from '../checkout/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { categories } from '../../data/products';
import { productsApi } from '../../services/api';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    loadProducts();
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAllProducts();
       console.log('Fetched from API:', data);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const { dispatch } = useCart();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState(new Set());

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product?.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(product => 
        product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      if (!a || !b) return 0;
      
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
  }, [selectedCategory, searchQuery, sortBy, products]);

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({
      value: cat.name.toLowerCase(),
      label: cat.name
    }))
  ];

  const handleAddToCart = (product) => {
    if (!product) return;
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: product 
    });
    toast.success(`Added ${product.name} to cart!`);
  };

  const toggleWishlist = (productId) => {
    if (!productId) return;
    setWishlist(prev => {
      const newWishlist = new Set(prev);
      if (newWishlist.has(productId)) {
        newWishlist.delete(productId);
        toast.success('Removed from wishlist');
      } else {
        newWishlist.add(productId);
        toast.success('Added to wishlist');
      }
      return newWishlist;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent absolute top-0 left-0"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-600 w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
            <div className="text-red-500 mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-lg font-semibold">{error}</p>
            </div>
            <button 
              onClick={loadProducts}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Animated Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-green-300 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -top-2 -right-2 w-16 h-16 bg-emerald-300 rounded-full opacity-30 animate-pulse delay-300"></div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent relative z-10 animate-fade-in">
              Our Products
            </h1>
            <p className="text-gray-600 mt-3 text-lg relative z-10 animate-fade-in delay-200">
              🌱 Fresh from the farm to your table
            </p>
          </div>
          <div className="flex items-center mt-6 md:mt-0 bg-white px-6 py-3 rounded-full shadow-lg border border-green-100 animate-slide-in">
            <Sparkles className="w-5 h-5 text-green-500 mr-2 animate-pulse" />
            <span className="text-gray-700 font-medium">
              Showing {filteredProducts.length} fresh products
            </span>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-12 border border-green-100 backdrop-blur-sm bg-white/80 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Enhanced Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5 group-focus-within:text-green-600 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Search for fresh products..."
                className="w-full pl-12 pr-4 py-3 border-2 border-green-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-300 hover:border-green-200 bg-green-50/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/0 to-emerald-400/0 group-focus-within:from-green-400/5 group-focus-within:to-emerald-400/5 transition-all duration-300 pointer-events-none"></div>
            </div>

            {/* Enhanced Category Filter */}
            <div className="relative group">
              <select
                className="appearance-none bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-100 rounded-xl px-6 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-300 hover:border-green-200 font-medium"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categoryOptions.map(category => (
                  <option key={`cat-${category.value}`} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5 pointer-events-none group-hover:text-green-600 transition-colors duration-300" />
            </div>

            {/* Enhanced Sort */}
            <div className="relative group">
              <select
                className="appearance-none bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-100 rounded-xl px-6 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-300 hover:border-green-200 font-medium"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">✨ Featured</option>
                <option value="price-low">💰 Price: Low to High</option>
                <option value="price-high">💎 Price: High to Low</option>
                <option value="rating">⭐ Top Rated</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5 pointer-events-none group-hover:text-green-600 transition-colors duration-300" />
            </div>
          </div>
        </div>

        {/* Enhanced Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product, index) => (
            <div 
              key={product._id || product.id} 
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 group border border-green-100 hover:border-green-200 transform hover:-translate-y-2 animate-fade-in-up flex flex-col h-full"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-contain transform group-hover:scale-110 transition-transform duration-500 p-4"
                />
                <button 
                  onClick={() => toggleWishlist(product._id || product.id)}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 border border-green-100"
                >
                  <Heart 
                    className={`w-5 h-5 transition-all duration-300 ${
                      wishlist.has(product._id || product.id) 
                        ? 'text-red-500 fill-current animate-pulse' 
                        : 'text-gray-600 hover:text-red-400'
                    }`} 
                  />
                </button>
                
                {/* Fresh Badge */}
                <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                  🌿 Fresh
                </div>
              </div>
              
                <div className="p-6 flex flex-col flex-grow">
                <div className="text-sm text-green-600 font-bold mb-3 capitalize bg-green-50 px-3 py-1 rounded-full inline-block">
                  {product.category}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-green-700 transition-colors duration-300 flex-grow">
                  {product.name}
                </h3>

                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ₹{product.price}
                    </div>
                    <span className="text-sm text-gray-600 font-normal">
                      /{product.unit}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center group/btn font-medium text-sm whitespace-nowrap"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1 group-hover/btn:animate-bounce" />
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Animated border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto border border-green-100">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria to find fresh products.
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.7s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
};

export default ProductCatalog;