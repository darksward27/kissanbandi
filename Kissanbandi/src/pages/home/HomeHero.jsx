import React, {useEffect} from 'react';
import { ChevronRight } from 'lucide-react';
import bgImage from '../../assets/images/BG/background-pattern.jpg';
import image1 from "../../assets/images/BG/vegetables.jpg";
import image2 from "../../assets/images/BG/fruits.jpg";

const HomeHero = () => {
    useEffect(() => {
        // Smooth scroll polyfill
        window.scrollTo({ top: 0});
    
        return () => {
          document.documentElement.style.scrollBehavior = 'auto';
        };
      }, []);
  return (
    <div
      className="relative py-8"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-white/80"></div>

      <div className="container mx-auto mt-32 px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Hero Card */}
          <div className="lg:col-span-2 bg-blue-50/90 backdrop-blur-sm rounded-3xl p-8 relative overflow-hidden shadow-lg">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="max-w-md z-10">
                <span className="text-orange-400 text-xl font-medium">100% Fresh & Natural</span>
                <h1 className="text-4xl font-bold text-gray-800 mt-4 mb-4">
                  Farm Fresh Vegetables & Fruits
                </h1>
                <p className="text-gray-600 mb-8">
                  Discover our exceptional selection of fresh, locally sourced vegetables and fruits, 
                  handpicked for quality and freshness.
                </p>
                <button className="bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-700 transition duration-300">
                  SHOP NOW
                </button>
              </div>
              
              {/* Hero Image */}
              <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full">
                <div className="relative w-full h-full">
                  <img
                    src={image1}
                    alt="Fresh produce showcase"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 object-cover rounded-l-3xl shadow-xl transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Slider dots */}
            <div className="flex space-x-2 mt-8">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>

          {/* Side Cards */}
          <div className="space-y-8">
            {/* First Offer Card */}
            <div className="bg-green-50/90 backdrop-blur-sm rounded-3xl p-6 relative overflow-hidden shadow-lg group">
              <div className="relative z-10">
                <span className="text-sm text-gray-600">SPECIAL OFFER</span>
                <h2 className="text-3xl font-bold text-gray-800 mt-2">20% Off</h2>
                <h3 className="text-xl font-semibold text-gray-800 mt-2">
                  Seasonal Vegetables
                </h3>
                <a
                  href="#"
                  className="inline-flex items-center text-gray-600 mt-4 hover:text-gray-800"
                >
                  Shop Collection
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 overflow-hidden rounded-tl-[100px]">
                <img
                  src={image1}
                  alt="Fresh seasonal vegetables"
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Second Offer Card */}
            <div className="bg-red-50/90 backdrop-blur-sm rounded-3xl p-6 relative overflow-hidden shadow-lg group">
              <div className="relative z-10">
                <span className="text-sm text-gray-600">FRESH ARRIVAL</span>
                <h2 className="text-3xl font-bold text-gray-800 mt-2">15% Off</h2>
                <h3 className="text-xl font-semibold text-gray-800 mt-2">
                  Organic Fruits
                </h3>
                <a
                  href="#"
                  className="inline-flex items-center text-gray-600 mt-4 hover:text-gray-800"
                >
                  Shop Collection
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 overflow-hidden rounded-tl-[100px]">
                <img
                  src={image2}
                  alt="Fresh organic fruits"
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;