import React, { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import Image1 from "../../assets/images2/apple.avif"
import Image2 from "../../assets/images2/mango.avif"
import Image3 from "../../assets/images2/avacado.avif"
import Image4 from "../../assets/images2/litchi.avif"
import { useCart } from "../checkout/CartContext";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../checkout/AuthProvider';
const SeasonalFruits = () => {
  const [notifications, setNotifications] = useState([]);
  
  const seasonalProducts = [
    {
      id: 'seasonal-fruits-1',
      name: "Apple",
      category: "Fruits",
      price: 180,
      rating: 4.5,
      reviews: 128,
      image: Image1,
      unit: "kg",
      description: "Fresh seasonal strawberries"
    },
    {
      id: 'seasonal-fruits-2',
      name: "Mango",
      category: "Fruits",
      price: 50,
      rating: 4.2,
      reviews: 95,
      image: Image2,
      unit: "kg",
      description: "Sweet and juicy watermelon"
    },
    {
      id: 'seasonal-fruits-3',
      name: "Avacado",
      category: "Fruits",
      price: 120,
      rating: 4.8,
      reviews: 156,
      image: Image3,
      unit: "kg",
      description: "Premium Alphonso mangoes"
    },
    {
      id: 'seasonal-fruits-4',
      name: "Litchi",
      category: "Fruits",
      price: 150,
      rating: 4.3,
      reviews: 82,
      image:Image4,
      unit: "kg",
      description: "Sweet and fresh litchi"
    },
    {
      id: 'seasonal-fruits-5',
      name: "Avacado",
      category: "Fruits",
      price: 120,
      rating: 4.8,
      reviews: 156,
      image: Image3,
      unit: "kg",
      description: "Premium Alphonso mangoes"
    },
    {
      id: 'seasonal-fruits-6',
      name: "Avacado",
      category: "Fruits",
      price: 120,
      rating: 4.8,
      reviews: 156,
      image: Image3,
      unit: "kg",
      description: "Premium Alphonso mangoes"
    },
    {
      id: 'seasonal-fruits-7',
      name: "Avacado",
      category: "Fruits",
      price: 120,
      rating: 4.8,
      reviews: 156,
      image: Image3,
      unit: "kg",
      description: "Premium Alphonso mangoes"
    },
    {
      id: 'seasonal-fruits-8',
      name: "Avacado",
      category: "Fruits",
      price: 120,
      rating: 4.8,
      reviews: 156,
      image: Image3,
      unit: "kg",
      description: "Premium Alphonso mangoes"
    }
  ];

  const showNotification = (message) => {
    const newNotification = {
      id: Date.now(),
      message
    };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 3000);
  };

  const navigate = useNavigate(); // ✅ define navigate here
  const { dispatch } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (product) => {
    if (!user) {
      navigate('/login'); // ✅ works now
      return;
    }

    dispatch({ type: "ADD_TO_CART", payload: product });
    showNotification(`Added ${product.name} to cart!`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#4CAF50] hover:text-[#45a049] transition-colors duration-300">
          Seasonal Fruits
        </h1>
        <p className="text-[#4CAF50] mt-2 text-lg hover:text-[#45a049] transition-colors duration-300">
          Fresh seasonal fruits picked at the peak of their flavor
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {seasonalProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <button className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors">
                <Heart className="w-5 h-5 text-gray-600 hover:text-[#4CAF50] transition-colors" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="text-sm text-green-600 font-medium mb-1 capitalize">
                {product.category}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 hover:text-[#4CAF50] transition-colors">
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
                <div className="text-lg font-bold text-gray-800 hover:text-[#4CAF50] transition-colors">
                  ₹{product.price}
                  <span className="text-sm text-gray-600 font-normal">/{product.unit}</span>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-[#45a049] transition-colors duration-300"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeasonalFruits;