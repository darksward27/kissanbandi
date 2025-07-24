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

// ✅ Import images directly (this is CRITICAL for Vite)
import sample1 from "../../assets/sample1.jpeg";
import sample2 from "../../assets/sample2.jpeg";
import sample3 from "../../assets/sample3.jpeg";
import hero1 from "../../assets/hero1.jpg";
import hero2 from "../../assets/hero2.jpg";
import hero3 from "../../assets/hero3.jpg";

const BOGATHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  // ✅ Use imported image variables
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
      image: sample1,
      backgroundImage: hero3,
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
      image: sample2,
      backgroundImage: hero2,
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
      image: sample3,
      backgroundImage: hero1,
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
    navigate("/products");
  };

  const currentProduct = products[currentSlide];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Images */}
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
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 opacity-10 z-10">
        <div className="absolute top-10 left-5 md:top-20 md:left-10 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 blur-xl"></div>
        <div className="absolute top-32 right-10 md:top-40 md:right-20 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/15 blur-2xl"></div>
        <div className="absolute bottom-10 left-1/4 md:bottom-20 md:left-1/3 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/25 blur-lg"></div>
        <div className="absolute bottom-32 right-1/4 w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/20 blur-xl"></div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-12 lg:py-16 relative z-20">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-2 md:mb-4 drop-shadow-2xl text-shimmer">
            SRI BOGAT
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto font-medium drop-shadow-lg text-shimmer px-4">
            Premium Spices & Coffee - From Our Farm to Your Kitchen
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center mb-6 sm:mb-8 md:mb-12">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
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
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white font-semibold text-xs shadow-lg bg-orange-900">
                {currentProduct.badge}
              </div>
              <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white font-bold text-xs shadow-lg bg-orange-400">
                {currentProduct.weight}
              </div>

              {/* Arrows */}
              <button
                onClick={() =>
                  handleSlideChange(
                    currentSlide === 0 ? products.length - 1 : currentSlide - 1
                  )
                }
                className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <ChevronLeft className="text-orange-800 w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() =>
                  handleSlideChange((currentSlide + 1) % products.length)
                }
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <ChevronRight className="text-orange-800 w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="order-1 lg:order-2 space-y-3 sm:space-y-4 backdrop-blur-2xl bg-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/20 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                {currentProduct.name}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-white/90">
                {currentProduct.tagline}
              </p>
              <p className="text-sm sm:text-base text-white/80">
                {currentProduct.description}
              </p>

              <ul className="text-xs sm:text-sm md:text-base text-white/90 space-y-1">
                {currentProduct.features.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="flex items-center gap-1 sm:gap-2 bg-white/20 px-2 sm:px-3 py-1 rounded-full text-white text-xs sm:text-sm">
                  <Leaf className="text-green-300 w-3 h-3 sm:w-4 sm:h-4" />
                  100% Natural
                </div>
                <div className="flex items-center gap-1 sm:gap-2 bg-white/20 px-2 sm:px-3 py-1 rounded-full text-white text-xs sm:text-sm">
                  <Award className="text-yellow-300 w-3 h-3 sm:w-4 sm:h-4" />
                  Premium Grade
                </div>
                <div className="flex items-center gap-1 sm:gap-2 bg-white/20 px-2 sm:px-3 py-1 rounded-full text-white text-xs sm:text-sm">
                  <Heart className="text-red-300 w-3 h-3 sm:w-4 sm:h-4" />
                  Fresh & Pure
                </div>
              </div>

              <button
                onClick={handleShopNowClick}
                className="mt-4 sm:mt-6 relative btn-shimmer bg-gradient-to-r from-[#4b2e1f] to-[#d1a873] px-4 sm:px-6 py-2 sm:py-3 rounded-full text-white font-semibold hover:scale-105 transition-all shadow-lg text-sm sm:text-base"
              >
                Shop Now <ChevronRight className="inline ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => handleSlideChange(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BOGATHero;