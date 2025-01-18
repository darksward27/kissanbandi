import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, ChevronDown, Star, Heart } from 'lucide-react';
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <button 
            onClick={loadProducts}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Our Products</h1>
          <p className="text-gray-600 mt-2">Fresh from the farm to your table</p>
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          <span className="text-gray-600 mr-2">
            Showing {filteredProducts.length} products
          </span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categoryOptions.map(category => (
                <option key={`cat-${category.value}`} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div 
            key={product._id || product.id} 
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 group"
          >
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <button 
                onClick={() => toggleWishlist(product._id || product.id)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors duration-200"
              >
                <Heart 
                  className={`w-5 h-5 ${
                    wishlist.has(product._id || product.id) 
                      ? 'text-red-500 fill-current' 
                      : 'text-gray-600'
                  }`} 
                />
              </button>
            </div>
            
            <div className="p-4">
              <div className="text-sm text-green-600 font-medium mb-1 capitalize">
                {product.category}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {product.name}
              </h3>
              
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-gray-600">{product.rating || 0}</span>
                </div>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600">{product.reviews || 0} reviews</span>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-lg font-bold text-gray-800">
                  ₹{product.price}
                  <span className="text-sm text-gray-600 font-normal">
                    /{product.unit}
                  </span>
                </div>
                <button 
                  onClick={() => handleAddToCart(product)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            No products found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;