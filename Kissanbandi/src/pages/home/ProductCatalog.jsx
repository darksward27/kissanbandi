import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, ChevronDown, Star, Heart } from 'lucide-react';
import { useCart } from '../checkout/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import orange from "../../assets/images/BG/fruits/oranges.jpg";
import Pomegranate from "../../assets/images/BG/fruits/Pomegranate.jpg";
import Mangoes from "../../assets/images/BG/fruits/Mangoes.jpg";
import Potatoes from "../../assets/images/BG/fruits/Potatoes.jpg";
import Tomatoes from "../../assets/images/BG/fruits/Tomatoes.jpg";
import Ginger from "../../assets/images/BG/fruits/Ginger.jpg";
import GreenChillies from "../../assets/images/BG/fruits/GreenChillies.jpg";
import Bananas from "../../assets/images/BG/fruits/Bananas.jpg";
import Onions from "../../assets/images/BG/fruits/Onions.jpg";
import Cauliflower from "../../assets/images/BG/fruits/Cauliflower.jpg";
import Pineapple from "../../assets/images/BG/fruits/Pineapple.jpg";
import CurryLeaves from "../../assets/images/BG/fruits/CurryLeaves.jpg";

const ProductCatalog = () => {
    useEffect(() => {
        // Smooth scroll polyfill
        window.scrollTo({ top: 0});
    
        return () => {
          document.documentElement.style.scrollBehavior = 'auto';
        };
      }, []);
  const { dispatch } = useCart();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState(new Set());

  // Sample product data with Indian categories and pricing
  const allProducts = [
    {
        id: 1,
        name: "Fresh Oranges",
        category: "fruits",
        price: 199,
        unit: "kg",
        rating: 4.5,
        reviews: 128,
        image: orange,
        description: "Sweet and juicy oranges, rich in Vitamin C"
      },
      {
        id: 2,
        name: "Organic Pomegranate",
        category: "fruits",
        price: 249,
        unit: "kg",
        rating: 4.8,
        reviews: 89,
        image: Pomegranate,
        description: "Fresh pomegranates with ruby red arils, perfect for juicing"
      },
      {
        id: 3,
        name: "Alphonso Mangoes",
        category: "fruits",
        price: 399,
        unit: "kg",
        rating: 4.9,
        reviews: 256,
        image: Mangoes,
        description: "Premium Alphonso mangoes from Ratnagiri, known for their rich flavor"
      },
      {
        id: 4,
        name: "Fresh Potatoes",
        category: "vegetables",
        price: 49,
        unit: "kg",
        rating: 4.3,
        reviews: 156,
        image: Potatoes,
        description: "Farm fresh potatoes, perfect for curries and snacks"
      },
      {
        id: 5,
        name: "Organic Tomatoes",
        category: "vegetables",
        price: 79,
        unit: "kg",
        rating: 4.6,
        reviews: 92,
        image: Tomatoes,
        description: "Vine-ripened organic tomatoes, locally grown"
      },
      {
        id: 6,
        name: "Fresh Ginger",
        category: "herbs",
        price: 159,
        unit: "kg",
        rating: 4.7,
        reviews: 45,
        image: Ginger,
        description: "Fresh aromatic ginger, essential for Indian cooking"
      },
      {
        id: 7,
        name: "Green Chillies",
        category: "herbs",
        price: 99,
        unit: "kg",
        rating: 4.4,
        reviews: 78,
        image: GreenChillies,
        description: "Fresh green chillies, adds spice to any dish"
      },
      {
        id: 8,
        name: "Sweet Bananas",
        category: "fruits",
        price: 69,
        unit: "dozen",
        rating: 4.3,
        reviews: 112,
        image: Bananas,
        description: "Perfectly ripened sweet bananas, rich in potassium"
      },
      {
        id: 9,
        name: "Fresh Onions",
        category: "vegetables",
        price: 39,
        unit: "kg",
        rating: 4.4,
        reviews: 189,
        image: Onions,
        description: "Premium quality onions, essential for daily cooking"
      },
      {
        id: 10,
        name: "Organic Cauliflower",
        category: "vegetables",
        price: 59,
        unit: "piece",
        rating: 4.5,
        reviews: 67,
        image: Cauliflower,
        description: "Fresh and crisp cauliflower, perfect for sabzi"
      },
      {
        id: 11,
        name: "Sweet Pineapple",
        category: "fruits",
        price: 89,
        unit: "piece",
        rating: 4.6,
        reviews: 94,
        image:  Pineapple,
        description: "Juicy and sweet pineapples, naturally ripened"
      },
      {
        id: 12,
        name: "Fresh Curry Leaves",
        category: "herbs",
        price: 29,
        unit: "bunch",
        rating: 4.8,
        reviews: 156,
        image: CurryLeaves,
        description: "Aromatic curry leaves, adds authentic flavor to South Indian dishes"
      },
    //   {
    //     id: 13,
    //     name: "Red Bell Peppers",
    //     category: "vegetables",
    //     price: 199,
    //     unit: "kg",
    //     rating: 4.7,
    //     reviews: 45,
    //     image: "/api/placeholder/300/300",
    //     description: "Sweet and crunchy red bell peppers, rich in vitamins"
    //   },
    //   {
    //     id: 14,
    //     name: "Fresh Mint Leaves",
    //     category: "herbs",
    //     price: 39,
    //     unit: "bunch",
    //     rating: 4.6,
    //     reviews: 88,
    //     image: "/api/placeholder/300/300",
    //     description: "Fresh mint leaves, perfect for chutneys and beverages"
    //   },
    //   {
    //     id: 15,
    //     name: "Green Grapes",
    //     category: "fruits",
    //     price: 149,
    //     unit: "kg",
    //     rating: 4.5,
    //     reviews: 167,
    //     image: "/api/placeholder/300/300",
    //     description: "Sweet and seedless green grapes, perfect for snacking"
    //   },
    //   {
    //     id: 16,
    //     name: "Fresh Coriander",
    //     category: "herbs",
    //     price: 29,
    //     unit: "bunch",
    //     rating: 4.7,
    //     reviews: 234,
    //     image: "/api/placeholder/300/300",
    //     description: "Fresh coriander leaves, essential for garnishing"
    //   },
    //   {
    //     id: 17,
    //     name: "Baby Carrots",
    //     category: "vegetables",
    //     price: 89,
    //     unit: "kg",
    //     rating: 4.4,
    //     reviews: 78,
    //     image: "/api/placeholder/300/300",
    //     description: "Sweet and tender baby carrots, perfect for salads"
    //   },
    //   {
    //     id: 18,
    //     name: "Sweet Limes (Mosambi)",
    //     category: "fruits",
    //     price: 129,
    //     unit: "kg",
    //     rating: 4.3,
    //     reviews: 91,
    //     image: "/api/placeholder/300/300",
    //     description: "Fresh mosambi, excellent source of Vitamin C"
    //   },
    //   {
    //     id: 19,
    //     name: "Green Peas",
    //     category: "vegetables",
    //     price: 119,
    //     unit: "kg",
    //     rating: 4.6,
    //     reviews: 145,
    //     image: "/api/placeholder/300/300",
    //     description: "Fresh green peas, perfect for pulao and curries"
    //   },
    //   {
    //     id: 20,
    //     name: "Fresh Turmeric",
    //     category: "herbs",
    //     price: 189,
    //     unit: "kg",
    //     rating: 4.8,
    //     reviews: 67,
    //     image: "/api/placeholder/300/300",
    //     description: "Fresh turmeric root, known for its medicinal properties"
    //   }
    // ... your existing products ...
  ];

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
  }, [selectedCategory, searchQuery, sortBy]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'herbs', label: 'Herbs & Seasonings' }
  ];

  const handleAddToCart = (product) => {
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: product 
    });
    toast.success(`Added ${product.name} to cart!`);
  };

  const toggleWishlist = (productId) => {
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
              {categories.map(category => (
                <option key={category.value} value={category.value}>
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
            key={product.id} 
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 group"
          >
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <button 
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors duration-200"
              >
                <Heart 
                  className={`w-5 h-5 ${
                    wishlist.has(product.id) 
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
                  <span className="ml-1 text-gray-600">{product.rating}</span>
                </div>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600">{product.reviews} reviews</span>
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
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
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