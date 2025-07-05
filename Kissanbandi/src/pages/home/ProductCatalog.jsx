import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Coffee, Zap, Leaf, Award, ChevronRight, Lock, Sparkles } from 'lucide-react';

const BOGATProductsShowcase = () => {
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Mock auth state
  const [wishlist, setWishlist] = useState(new Set());
  const [cartAnimation, setCartAnimation] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState([0, 0, 0]);
  const navigate = useNavigate();

  // Product data based on the documents
  const products = [
    {
      id: 1,
      name: "South Indian Filter Coffee Powder",
      brand: "BOGAT",
      weight: "450gm",
      price: 299,
      originalPrice: 399,
      rating: 4.8,
      reviews: 1247,
      category: "Coffee",
      images: [
        "/src/assets/sample1.jpg",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&h=500&fit=crop"
      ],
      badge: "🍁 Traditional Blend",
      features: [
        "70% Coffee, 30% Chicory ratio",
        "Single-Origin from Chikkamagaluru",
        "Shadow-Grown under native trees",
        "Handpicked & Sun-Dried",
        "Roasted in Small Batches"
      ],
      description: "Balanced taste with low bitterness and slightly earthy notes. Perfect for filter decoction - strong, smooth, and deeply satisfying.",
      highlights: ["🌿 Single-Origin", "👐 Handpicked", "🔥 Small Batch Roasted", "☕ Perfect for Filter"]
    },
    {
      id: 2,
      name: "Black Pepper Powder",
      brand: "BOGAT",
      weight: "200gm",
      price: 159,
      originalPrice: 199,
      rating: 4.9,
      reviews: 856,
      category: "Spices",
      images: [
        "/src/assets/sample2.jpg",
        "https://images.unsplash.com/photo-1588166524941-b5c59d56883b?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1609501676725-7186f734b2a7?w=500&h=500&fit=crop"
      ],
      badge: "⚡ King of Spices",
      features: [
        "Rich in Piperine for wellness",
        "100% Natural & Pure",
        "No preservatives or additives",
        "Ethically sourced from India",
        "Sun-dried to preserve potency"
      ],
      description: "Bold, aromatic black pepper powder packed with natural goodness. Enhances digestion and boosts nutrient absorption.",
      highlights: ["👑 King of Spices", "💪 Rich in Piperine", "🌿 100% Natural", "🚫 No Additives"]
    },
    {
      id: 3,
      name: "Whole Cardamom (Elaichi)",
      brand: "BOGAT",
      weight: "100gm",
      price: 249,
      originalPrice: 319,
      rating: 4.7,
      reviews: 623,
      category: "Spices",
      images: [
        "/src/assets/sample3.jpg",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1606471838515-d26a0131eb96?w=500&h=500&fit=crop"
      ],
      badge: "👑 Queen of Spices",
      features: [
        "100% Pure & Natural pods",
        "Premium hand-selected quality",
        "Rich essential oil content",
        "Aids digestion naturally",
        "Ethically sourced from India"
      ],
      description: "Sweet, bold aroma that elevates teas, sweets, biryanis, and curries. Traditionally used for wellness and breath freshening.",
      highlights: ["👸 Queen of Spices", "🌿 Health-Boosting", "✨ Aromatic", "🫖 Perfect for Tea"]
    }
  ];

  // Auto-rotate product images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => 
        prev.map((index, productIndex) => 
          (index + 1) % products[productIndex].images.length
        )
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      return;
    }
    
    setCartAnimation('animate-bounce');
    setTimeout(() => setCartAnimation(''), 600);
    
    // Add success animation or toast here
    console.log(`Added ${product.name} to cart`);
  };

  const toggleWishlist = (productId) => {
    if (!isAuthenticated) {
      alert('Please login to add items to wishlist');
      return;
    }

    const newWishlist = new Set(wishlist);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
    } else {
      newWishlist.add(productId);
    }
    setWishlist(newWishlist);
  };

  const handleCardClick = (index, e) => {
    // Prevent navigation if clicking on interactive elements
    if (e.target.closest('button')) {
      return;
    }
    
    // Set selected product for visual feedback
    setSelectedProduct(index);
    
    // Navigate to products page after a short delay for visual feedback
    setTimeout(() => {
      navigate('/products');
    }, 200);
  };

  const currentProduct = products[selectedProduct];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EFE6] via-[#EBDACD] to-[#D8C3A5]">
      {/* Hero Section with Custom Background */}

      {/* Product Selection Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-[#23150c] to-[#dda64e] bg-clip-text text-transparent mb-12">
            Complete BOGAT Collection
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div
                key={product.id}
                onClick={(e) => handleCardClick(index, e)}
                className={`rounded-2xl shadow-lg overflow-hidden border transition-all duration-500 cursor-pointer group relative ${
                  selectedProduct === index
                    ? 'border-orange-400 shadow-2xl transform scale-105'
                    : 'border-orange-200 hover:border-orange-400 hover:shadow-xl hover:transform hover:scale-105'
                }`}
                style={{ height: '300px' }}
              >
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Click indicator */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                      <ChevronRight className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                  
                  {/* Name overlay that slides up from bottom on hover */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    <div 
                      className="px-6 py-4 text-white"
                      style={{
                        background: `linear-gradient(180deg, transparent 0%, rgba(130, 48, 0, 0.9) 100%)`
                      }}
                    >
                      <h4 className="text-xl font-bold text-center">
                        {product.name}
                      </h4>
                      <p className="text-center text-sm mt-1 opacity-90">
                        Click to explore
                      </p>
                    </div>
                  </div>

                  {/* Rating badge */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1 shadow-lg">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold text-gray-800">{product.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AUTHENTIC INDIAN FLAVOURS SECTION */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/src/assets/bogat1.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-semibold text-white">Premium BOGAT Collection</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl">
              Authentic Indian
              <span className="block text-yellow-300 drop-shadow-2xl">Flavors</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed drop-shadow-lg">
              From our family farms to your kitchen - experience the pure essence of traditional Indian spices and coffee
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Leaf className="w-4 h-4 text-green-300" />
                <span className="text-white font-medium">100% Natural</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Award className="w-4 h-4 text-yellow-300" />
                <span className="text-white font-medium">Premium Quality</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Coffee className="w-4 h-4 text-amber-300" />
                <span className="text-white font-medium">Traditional Methods</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOGATProductsShowcase;