import React, {useEffect, useState} from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/images/BG/background-pattern.jpg';
import image1 from "../../assets/images/BG/vegetables.jpg";
import image2 from "../../assets/images/BG/fruits.jpg";
// Using existing images for now - replace with actual images later:
// import image3 from "../../assets/images/BG/herbs.jpg"; 
// import image4 from "../../assets/images/BG/organic-basket.jpg";

const HomeHero = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    // Carousel content data
    const carouselData = [
        {
            badge: "🌱 100% Fresh & Natural",
            title: "Farm Fresh Vegetables & Fruits",
            description: "Discover our exceptional selection of fresh, locally sourced vegetables and fruits, handpicked for quality and freshness.",
            buttonText: "SHOP NOW",
            image: image1,
            imageAlt: "Fresh produce showcase",
            action: () => navigate('/category/vegetables/fruits-veg')
        },
        {
            badge: "🌿 Premium Organic",
            title: "Fresh Organic Herbs & Greens",
            description: "Explore our carefully cultivated organic herbs and leafy greens, grown without pesticides for pure, natural flavor.",
            buttonText: "BROWSE HERBS",
            image: image2, // Using fruits image temporarily - replace with herbs image
            imageAlt: "Fresh organic herbs and greens",
            action: () => navigate('/category/vegetables/organic-vegetables')
        },
        {
            badge: "🥗 Farm to Table",
            title: "Handpicked Seasonal Produce",
            description: "Experience the best of each season with our rotating selection of peak-freshness produce, delivered straight from local farms.",
            buttonText: "VIEW SEASONAL",
            image: image1, // Using vegetables image temporarily - replace with seasonal image
            imageAlt: "Seasonal fresh produce",
            action: () => navigate('/seasonal')
        },
        {
            badge: "🧺 Curated Selection",
            title: "Premium Organic Bundles",
            description: "Save time and money with our thoughtfully curated organic produce bundles, perfect for healthy families and conscious cooking.",
            buttonText: "SHOP BUNDLES",
            image: image2, // Using fruits image temporarily - replace with bundles image
            imageAlt: "Organic produce bundles",
            action: () => navigate('/bundles')
        }
    ];

    useEffect(() => {
        // Smooth scroll polyfill
        window.scrollTo({ top: 0});
    
        return () => {
          document.documentElement.style.scrollBehavior = 'auto';
        };
    }, []);

    // Auto-advance carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselData.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [carouselData.length]);

    const handleNavigateToFruits = (e) => {
        e.preventDefault();
        navigate('/organicfruits');
    };

    const handleNavigateToVegetables = (e) => {
        e.preventDefault();
        navigate('/seasonals');
    };

    const handleNavigateToFruitsVeg = (e) => {
        e.preventDefault();
        navigate('/fruitsveg');
    };

    const handleSlideChange = (index) => {
        setCurrentSlide(index);
    };

    const currentSlideData = carouselData[currentSlide];
    return (
        <div
            className="relative py-8 min-h-screen flex items-center"
            style={{
                backgroundImage: `url(${bgImage})`,
                backgroundRepeat: 'repeat',
                backgroundPosition: 'center',
            }}
        >
            {/* Enhanced gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/90 via-white/85 to-emerald-50/90 backdrop-blur-sm"></div>
            
            {/* Floating background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-emerald-200/20 to-green-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
                <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-gradient-to-br from-green-300/40 to-emerald-300/40 rounded-full blur-lg animate-pulse delay-500"></div>
            </div>

            <div className="container mx-auto mt-32 px-4 relative animate-in fade-in duration-1000">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Enhanced Main Hero Card - Fixed overlapping issue */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-white/95 to-green-50/95 backdrop-blur-lg rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-green-100/50 hover:shadow-3xl hover:shadow-green-200/20 transition-all duration-500 group animate-in slide-in-from-left duration-800">
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            {/* Text Content - Left Side */}
                            <div className="z-10 space-y-6">
                                <span className="inline-block text-emerald-600 text-xl font-semibold px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full shadow-md animate-pulse">
                                    {currentSlideData.badge}
                                </span>
                                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-800 to-green-800 bg-clip-text text-transparent leading-tight transition-all duration-500">
                                    {currentSlideData.title}
                                </h1>
                                <p className="text-gray-600 text-lg leading-relaxed transition-all duration-500">
                                    {currentSlideData.description}
                                </p>
                                <button 
                                    onClick={currentSlideData.action}
                                    className="group/btn bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-300/50 hover:scale-105 hover:-translate-y-1 font-semibold text-lg relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center space-x-2">
                                        <span>{currentSlideData.buttonText}</span>
                                        <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                                </button>
                            </div>
                            
                            {/* Enhanced Hero Image - Right Side - Fixed positioning */}
                            <div className="relative w-full h-80 lg:h-96">
                                <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-green-300/30 hover:shadow-green-400/40 transition-all duration-500 group-hover:scale-105">
                                    <img
                                        src={currentSlideData.image}
                                        alt={currentSlideData.imageAlt}
                                        className="w-full h-full object-cover transition-all duration-700 hover:scale-110"
                                        key={currentSlide} // Force re-render for smooth transitions
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-green-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                {/* Floating accent elements */}
                                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full shadow-lg animate-bounce delay-300"></div>
                                <div className="absolute -bottom-6 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-400 rounded-full shadow-md animate-bounce delay-700"></div>
                            </div>
                        </div>

                        {/* Enhanced Slider dots - Now functional */}
                        <div className="flex space-x-3 mt-8">
                            {carouselData.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSlideChange(index)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                                        index === currentSlide
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-md scale-110'
                                            : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-green-300 hover:to-emerald-300 hover:scale-105'
                                    }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Enhanced Side Cards */}
                    <div className="space-y-8">
                        {/* First Enhanced Offer Card */}
                        <div className="bg-gradient-to-br from-green-50/95 to-emerald-100/95 backdrop-blur-lg rounded-3xl p-6 relative overflow-hidden shadow-xl border border-green-200/50 hover:shadow-2xl hover:shadow-green-300/30 transition-all duration-500 group hover:scale-105 hover:-translate-y-2 animate-in slide-in-from-right duration-800 delay-200">
                            {/* Animated background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            {/* Floating particles */}
                            <div className="absolute top-2 right-4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                            <div className="absolute top-6 right-8 w-1 h-1 bg-emerald-400 rounded-full animate-ping delay-300"></div>
                            
                            <div className="relative z-10 mb-20">
                                <span className="inline-block text-sm text-green-700 font-semibold px-3 py-1 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full shadow-sm">
                                    ✨ SPECIAL OFFER
                                </span>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mt-3 group-hover:scale-110 transition-transform duration-300">
                                    20% Off
                                </h2>
                                <h3 className="text-xl font-semibold text-gray-800 mt-2 group-hover:text-green-800 transition-colors duration-300">
                                    Seasonal Vegetables
                                </h3>
                                <a
                                    href="#"
                                    onClick={handleNavigateToVegetables}
                                    className="inline-flex items-center text-green-600 mt-4 hover:text-green-800 font-medium group/link"
                                >
                                    <span className="border-b-2 border-transparent group-hover/link:border-green-600 transition-all duration-300">
                                        Shop Collection
                                    </span>
                                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                                </a>
                            </div>
                            <div className="absolute right-0 bottom-0 w-32 h-32 overflow-hidden rounded-tl-[100px]">
                                <div className="relative w-full h-full">
                                    <img
                                        src={image1}
                                        alt="Fresh seasonal vegetables"
                                        className="w-full h-full object-cover transform group-hover:scale-125 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-tl from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                            </div>
                        </div>

                        {/* Second Enhanced Offer Card */}
                        <div className="bg-gradient-to-br from-orange-50/95 to-red-50/95 backdrop-blur-lg rounded-3xl p-6 relative overflow-hidden shadow-xl border border-orange-200/50 hover:shadow-2xl hover:shadow-orange-300/30 transition-all duration-500 group hover:scale-105 hover:-translate-y-2 animate-in slide-in-from-right duration-800 delay-400">
                            {/* Animated background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            {/* Floating particles */}
                            <div className="absolute top-2 right-4 w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
                            <div className="absolute top-6 right-8 w-1 h-1 bg-red-400 rounded-full animate-ping delay-300"></div>
                            
                            <div className="relative z-10 mb-20">
                                <span className="inline-block text-sm text-orange-700 font-semibold px-3 py-1 bg-gradient-to-r from-orange-200 to-red-200 rounded-full shadow-sm">
                                    🍎 FRESH ARRIVAL
                                </span>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent mt-3 group-hover:scale-110 transition-transform duration-300">
                                    15% Off
                                </h2>
                                <h3 className="text-xl font-semibold text-gray-800 mt-2 group-hover:text-orange-800 transition-colors duration-300">
                                    Organic Fruits
                                </h3>
                                <a
                                    href="#"
                                    onClick={handleNavigateToFruits}
                                    className="inline-flex items-center text-orange-600 mt-4 hover:text-orange-800 font-medium group/link"
                                >
                                    <span className="border-b-2 border-transparent group-hover/link:border-orange-600 transition-all duration-300">
                                        Shop Collection
                                    </span>
                                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                                </a>
                            </div>
                            <div className="absolute right-0 bottom-0 w-32 h-32 overflow-hidden rounded-tl-[100px]">
                                <div className="relative w-full h-full">
                                    <img
                                        src={image2}
                                        alt="Fresh organic fruits"
                                        className="w-full h-full object-cover transform group-hover:scale-125 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-tl from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeHero;