import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Star,
  Award,
  Leaf,
  Heart,
} from "lucide-react";

const BOGATHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  // Product data with corresponding background images
  const products = [
    {
      id: 1,
      name: "South Indian Filter Coffee Powder",
      tagline: "Traditional Blend with 70% Coffee, 30% Chicory",
      description:
        "Sourced from our family-owned estate in Chikkamagaluru. Shadow-grown beneath native trees, handpicked with care, and roasted in small batches to preserve aroma and ensure consistent quality.",
      features: [
        "Balanced taste with 70:30 coffee-to-chicory ratio",
        "Single-Origin from Chikkamagaluru",
        "Shadow-Grown under native forest trees",
        "Roasted in Small Batches",
      ],
      weight: "450gm",
      badge: "Premium Coffee",
      image: "/src/assets/sample1.jpg",
      backgroundImage: "src/assets/hero3.jpg",
      color: "from-amber-100 to-orange-100",
      accentColor: "amber",
    },
    {
      id: 2,
      name: "Black Pepper Powder",
      tagline: "King of Spices - Strong Flavour & Bold Aroma",
      description:
        "Handpicked from the rich soils of India, our premium black peppercorns are sun-dried to preserve their potent aroma and deep flavour. Rich in piperine for enhanced wellness.",
      features: [
        "Known as the 'King of Spices'",
        "Rich in Piperine for better digestion",
        "100% Natural with no preservatives",
        "Ethically sourced premium grade",
      ],
      weight: "200gm",
      badge: "Wellness Spice",
      image: "/src/assets/sample2.jpg",
      backgroundImage: "src/assets/hero2.jpg",
      color: "from-stone-100 to-amber-50",
      accentColor: "stone",
    },
    {
      id: 3,
      name: "Whole Cardamom",
      tagline: "Queen of Spices - Premium Indian Elaichi",
      description:
        "Hand-selected, bold-sized pods with rich essential oil content. Traditionally used to aid digestion, freshen breath, and elevate teas, sweets, and curries with signature warm-sweet aroma.",
      features: [
        "Premium Quality hand-selected pods",
        "Aromatic & Flavorful for all dishes",
        "Health-Boosting digestive properties",
        "Ethically sourced from trusted farms",
      ],
      weight: "100gm",
      badge: "Royal Spice",
      image: "/src/assets/sample3.jpg",
      backgroundImage: "src/assets/hero1.jpg",
      color: "from-green-100 to-emerald-50",
      accentColor: "green",
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % products.length);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, [products.length]);

  const handleSlideChange = (index) => {
    if (index !== currentSlide && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 300);
    }
  };

  const handleShopNowClick = () => {
    navigate('/products');
  };

  const currentProduct = products[currentSlide];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background Images with Black Overlay */}
      <div className="absolute inset-0 transition-all duration-1000">
        {products.map((product, index) => (
          <div
            key={product.id}
            className={`absolute inset-0 transition-all duration-1000 ${
              index === currentSlide
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105"
            }`}
            style={{
              backgroundImage: `url(${product.backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Black overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ))}
      </div>

      {/* Enhanced Background Pattern - Removed brown elements */}
      <div className="absolute inset-0 opacity-10 z-10">
        <div className="absolute top-10 left-5 md:top-20 md:left-10 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 blur-xl"></div>
        <div className="absolute top-32 right-10 md:top-40 md:right-20 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/15 blur-2xl"></div>
        <div className="absolute bottom-10 left-1/4 md:bottom-20 md:left-1/3 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/25 blur-lg"></div>
        <div className="absolute bottom-32 right-1/4 w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/20 blur-xl"></div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-12 lg:py-16 relative z-20">
        {/* Brand Header */}
        <div className="text-center mb-6 md:mb-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-2 md:mb-4 text-white drop-shadow-2xl">
            BOGAT
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto font-medium drop-shadow-lg">
            Premium Spices & Coffee - From Our Farm to Your Kitchen
          </p>
        </div>

        {/* Main Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center mb-8 md:mb-12">
          {/* Left Side - Product Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative w-full h-80 md:h-96 lg:h-[500px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
              {/* Image Container */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${currentProduct.color} transition-all duration-500`}
              >
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className={`w-full h-full object-cover transition-all duration-700 ${
                    isTransitioning
                      ? "opacity-0 scale-110"
                      : "opacity-100 scale-100"
                  }`}
                />
              </div>

              {/* Floating Badge */}
              <div
                className="absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-white font-semibold text-xs md:text-sm shadow-lg"
                style={{ backgroundColor: "#823000" }}
              >
                {currentProduct.badge}
              </div>

              {/* Weight Badge */}
              <div
                className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-white font-bold text-xs md:text-sm shadow-lg"
                style={{ backgroundColor: "#f59b52" }}
              >
                {currentProduct.weight}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() =>
                  handleSlideChange(
                    currentSlide === 0 ? products.length - 1 : currentSlide - 1
                  )
                }
                className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft
                  className="w-5 h-5 md:w-6 md:h-6"
                  style={{ color: "#823000" }}
                />
              </button>
              <button
                onClick={() =>
                  handleSlideChange((currentSlide + 1) % products.length)
                }
                className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110"
              >
                <ChevronRight
                  className="w-5 h-5 md:w-6 md:h-6"
                  style={{ color: "#823000" }}
                />
              </button>
            </div>
          </div>

          {/* Right Side - Product Description with Enhanced Glassmorphism */}
          <div className="order-1 lg:order-2 space-y-4 md:space-y-6 backdrop-blur-2xl bg-white/10 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 relative overflow-hidden">
            {/* Enhanced Glassmorphism effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-white/10 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 rounded-3xl"></div>

            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-3xl shadow-inner shadow-white/20"></div>

            {/* Content wrapper */}
            <div className="relative z-10">
              <div
                className={`transition-all duration-500 ${
                  isTransitioning
                    ? "opacity-0 translate-y-4"
                    : "opacity-100 translate-y-0"
                }`}
              >
                {/* Product Name */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-2 md:mb-4 text-white drop-shadow-2xl">
                  {currentProduct.name}
                </h2>

                {/* Tagline */}
                <p className="text-base md:text-lg lg:text-xl font-medium mb-4 md:mb-6 text-white/90 drop-shadow-lg">
                  {currentProduct.tagline}
                </p>

                {/* Description */}
                <p className="text-white/85 text-sm md:text-base lg:text-lg leading-relaxed mb-6 md:mb-8 drop-shadow-lg">
                  {currentProduct.description}
                </p>

                {/* Features */}
                <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  {currentProduct.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 md:space-x-3"
                    >
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mt-2 md:mt-3 flex-shrink-0 bg-white/80 shadow-lg"></div>
                      <span className="text-white/90 font-medium text-sm md:text-base drop-shadow-md">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quality Badges with Enhanced Glassmorphism */}
                <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8">
                  <div className="flex items-center space-x-1 md:space-x-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg">
                    <Leaf className="w-4 h-4 md:w-5 md:h-5 text-green-300" />
                    <span className="text-xs md:text-sm font-semibold text-white">
                      100% Natural
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg">
                    <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-300" />
                    <span className="text-xs md:text-sm font-semibold text-white">
                      Premium Grade
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-300" />
                    <span className="text-xs md:text-sm font-semibold text-white">
                      Fresh & Pure
                    </span>
                  </div>
                </div>

                {/* CTA Button with Enhanced Glassmorphism */}
                <button 
                  onClick={handleShopNowClick}
                  className="group relative overflow-hidden bg-gradient-to-r from-[#4B2E0F] via-[#7B3F00] to-[#D2A679] backdrop-blur-xl border border-white/20 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-base md:text-lg shadow-2xl hover:shadow-white/30 transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex items-center space-x-2 md:space-x-3 w-full md:w-auto justify-center md:justify-start"
                >
                  <span>Shop Now</span>
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />

                  {/* Enhanced shimmer effect */}
                  <span className="absolute top-0 left-[-150%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-80 blur-md animate-shimmer" />
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* Product Dots Navigation */}
        <div className="flex justify-center space-x-3 md:space-x-4 mb-6">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => handleSlideChange(index)}
              className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 border-2 border-white/50 ${
                index === currentSlide
                  ? "scale-125 shadow-lg bg-white"
                  : "scale-100 opacity-60 hover:opacity-100 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Enhanced Mobile Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/30 to-transparent pointer-events-none md:hidden"></div>
    </div>
  );
};

export default BOGATHero;