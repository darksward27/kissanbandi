import React, { useState, useEffect } from 'react';
import { useAuth } from '../checkout/AuthProvider';
import { useCart } from '../checkout/CartContext';
import { toast } from 'react-hot-toast';
import { Heart, ShoppingCart, Loader, Trash2, Sparkles } from 'lucide-react';
import api from '../../services/api';

const Wishlist = () => {
  const { user } = useAuth();
  const { dispatch } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    loadWishlist();
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/wishlist');
      setWishlist(response.data);
    } catch (err) {
      setTimeout(() => {
        toast.error('Failed to load wishlist');
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await api.delete(`/users/wishlist/${productId}`);
      setWishlist(wishlist.filter(item => item._id !== productId));
      setTimeout(() => {
        toast.success('Removed from wishlist');
      }, 0);
    } catch (err) {
      setTimeout(() => {
        toast.error('Failed to remove from wishlist');
      }, 0);
    }
  };

  const handleAddToCart = (product) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      }
    });
    setTimeout(() => {
      toast.success(`${product.name} added to cart`);
    }, 0);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Animated Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-red-300 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -top-2 -right-2 w-16 h-16 bg-pink-300 rounded-full opacity-30 animate-pulse delay-300"></div>
            <div className="flex items-center relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mr-4 shadow-lg animate-bounce">
                <Heart className="w-8 h-8 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-green-600 bg-clip-text text-transparent animate-fade-in">
                  My Wishlist
                </h1>
                <p className="text-gray-600 mt-3 text-lg animate-fade-in delay-200">
                  💖 Your favorite fresh products
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center mt-6 md:mt-0 bg-white px-6 py-3 rounded-full shadow-lg border border-green-100 animate-slide-in">
            <Heart className="w-5 h-5 text-red-500 mr-2 animate-pulse fill-current" />
            <span className="text-gray-700 font-medium">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
            </span>
          </div>
        </div>

        {wishlist.length === 0 ? (
          /* Enhanced Empty State */
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto border border-green-100 transform hover:scale-105 transition-transform duration-300">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Heart className="w-12 h-12 text-red-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-200 rounded-full opacity-60 animate-ping"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6">
                Save items you love by clicking the heart icon on products. Start building your dream collection! 🌟
              </p>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <p className="text-green-700 text-sm font-medium">
                  💡 Tip: Browse our fresh products and add your favorites here
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Enhanced Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {wishlist.map((product, index) => (
              <div 
                key={product._id} 
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
                  
                  {/* Remove from Wishlist Button */}
                  <button 
                    onClick={() => handleRemoveFromWishlist(product._id)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-red-50 hover:scale-110 transition-all duration-300 border border-red-100 group/remove"
                  >
                    <Trash2 className="w-5 h-5 text-red-500 group-hover/remove:text-red-600 transition-colors duration-300" />
                  </button>
                  
                  {/* Wishlist Badge */}
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                    💖 Saved
                  </div>

                  {/* Fresh Badge */}
                  <div className="absolute bottom-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    🌿 Fresh
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-sm text-green-600 font-bold mb-3 capitalize bg-green-50 px-3 py-1 rounded-full inline-block">
                    {product.category || 'Fresh Product'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-green-700 transition-colors duration-300 flex-grow">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex justify-between items-end mt-auto">
                    <div className="flex flex-col">
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ₹{product.price}
                      </div>
                      <span className="text-sm text-gray-600 font-normal">
                        /{product.unit || 'piece'}
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
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400 via-pink-400 to-green-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Action Hint */}
        {wishlist.length > 0 && (
          <div className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-xl animate-bounce z-50">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">
                {wishlist.length} items in wishlist
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
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
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Wishlist;