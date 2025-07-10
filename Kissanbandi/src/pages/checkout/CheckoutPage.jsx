import React, { useState, useEffect } from 'react';
import { useCart } from '../checkout/CartContext';
import { useAuth } from '../checkout/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Trash2, MapPin, ShoppingBag, CreditCard, Truck, CheckCircle, Edit3, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../services/api';

const CheckoutPage = () => {
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [useRegisteredAddress, setUseRegisteredAddress] = useState(true);
  const [customAddress, setCustomAddress] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Animate items loading
    setTimeout(() => setItemsLoaded(true), 100);

    // Show toast if cart is empty
    if (state.items.length === 0) {
      toast.error('Your cart is empty', { id: 'cart-empty' });
    }

    // Initialize custom address with user data if available
    if (user && user.address) {
      setCustomAddress({
        address: formatAddress(user.address),
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        phone: user.phone || ''
      });
    }

    // Cleanup function
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [state.items.length, user]);

  const updateQuantity = (item, quantity) => {
    if (quantity < 1) return;

    const maxQty = item.stock ?? Infinity;

    if (quantity > maxQty) {
      toast.error(`Only ${maxQty} in stock`);
      return;
    }

    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: {
        id: item.id || item._id,
        size: item.size,
        color: item.color,
        quantity
      }
    });
  };

  const removeItem = (item) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: {
        id: item.id || item._id,
        size: item.size,
        color: item.color
      }
    });
    toast.success('Item removed from cart', { id: 'cart-empty' });
  };

  const calculateSubtotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  const formatAddress = (addressObj) => {
    if (typeof addressObj === 'string') return addressObj;
    if (!addressObj) return '';
    
    const parts = [];
    if (addressObj.street) parts.push(addressObj.street);
    if (addressObj.locality) parts.push(addressObj.locality);
    if (addressObj.city) parts.push(addressObj.city);
    if (addressObj.state) parts.push(addressObj.state);
    if (addressObj.pincode) parts.push(addressObj.pincode);
    
    return parts.join(', ');
  };

  const handleCustomAddressChange = (field, value) => {
    setCustomAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getShippingAddress = () => {
    if (useRegisteredAddress && user?.address) {
      return {
        address: formatAddress(user.address),
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        phone: user.phone || ''
      };
    } else {
      return customAddress;
    }
  };

  const validateAddress = () => {
    const address = getShippingAddress();
    
    if (!address.address || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill in all address fields');
      return false;
    }
    
    if (address.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    
    return true;
  };

  const handleProceedToPayment = async () => {
    try {
      if (!user) {
        navigate('/login');
        toast.error('Please login to continue', { id: 'cart-empty' });
        return;
      }

      if (!validateAddress()) {
        return;
      }

      setIsProcessing(true);

      if (paymentMethod === 'razorpay') {
        // Validate Razorpay key
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        console.log("Razorpay Key:", import.meta.env.VITE_RAZORPAY_KEY_ID);
        if (!razorpayKey || !razorpayKey.startsWith('rzp_')) {
          toast.dismiss('cart-empty');
          toast.error('Invalid Razorpay configuration. Please contact support.');
          setIsProcessing(false);
          return;
        }

        console.log('Using Razorpay Key:', razorpayKey);

        try {
          // Create Razorpay order
          const orderResponse = await ordersApi.createRazorpayOrder({ 
            amount: total 
          }, user.token);

          console.log('Order Response:', orderResponse);

          if (!orderResponse.orderId) {
            throw new Error('Failed to create order');
          }

          // Check if Razorpay is loaded
          if (!window.Razorpay) {
            toast.dismiss('cart-empty');
            toast.error('Payment system not loaded. Please refresh and try again.');
            setIsProcessing(false);
            return;
          }

          // Initialize Razorpay payment
          const options = {
            key: razorpayKey,
            amount: total * 100,
            currency: "INR",
            name: "Bogat",
            description: "Purchase of premium products",
            order_id: orderResponse.orderId,
            handler: async function(response) {
              try {
                console.log('Payment Response:', response);
                
                // Verify payment
                const verificationResponse = await ordersApi.verifyPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_details: {
                    items: state.items.map(item => ({
                      product: item._id || item.id,
                      quantity: item.quantity,
                      price: item.price
                    })),
                    shippingAddress: getShippingAddress(),
                    shipping: subtotal > 500 ? 0 : 50
                  }
                }, user.token);

                if (verificationResponse.success) {
                  toast.dismiss('cart-empty');
                  toast.success('Payment successful!');
                  dispatch({ type: 'CLEAR_CART' });
                  navigate('/orders');
                } else {
                  throw new Error('Payment verification failed');
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                toast.dismiss('cart-empty');
                toast.error('Payment verification failed. Please contact support.');
              } finally {
                setIsProcessing(false);
              }
            },
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phone || ''
            },
            theme: {
              color: "#b45309"
            },
            modal: {
              ondismiss: function() {
                setIsProcessing(false);
                toast.info('Payment cancelled');
              }
            }
          };

          const razorpay = new window.Razorpay(options);
          razorpay.on('payment.failed', function (response) {
            console.error('Payment failed:', response.error);
            toast.dismiss('cart-empty');
            toast.error(`Payment failed: ${response.error.description}`);
            setIsProcessing(false);
          });
          
          razorpay.open();
        } catch (orderError) {
          console.error('Order creation error:', orderError);
          toast.error('Failed to initiate payment. Please try again.', { id: 'cart-empty' });
          setIsProcessing(false);
        }
      } else {
        await handleCODOrder();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleCODOrder = async () => {
    try {
      const response = await ordersApi.createOrder({
        items: state.items.map(item => ({
          product: item._id || item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: getShippingAddress(),
        paymentMethod: 'cod',
        shipping: subtotal > 500 ? 0 : 50
      }, user.token);

      if (response._id) {
        toast.success('Order placed successfully!', { id: 'cart-empty' });
        dispatch({ type: 'CLEAR_CART' });
        navigate('/orders');
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('COD order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show empty cart state if no items
  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-4 py-8 pt-32">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-200 p-8 transform hover:scale-105 transition-all duration-500">
              <div className="text-amber-300 mb-6 animate-bounce">
                <ShoppingBag className="w-24 h-24 mx-auto" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Looks like you haven't added any items to your cart yet.
                Start shopping to add items to your cart.
              </p>
              <button
                onClick={() => navigate('/')}
                className="group bg-gradient-to-r from-amber-600 to-orange-700 text-white px-8 py-4 rounded-2xl font-medium hover:from-amber-700 hover:to-orange-800 transition-all duration-300 inline-flex items-center transform hover:scale-105 hover:shadow-lg"
              >
                <ShoppingBag className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Continue Shopping
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Regular checkout view with items
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent mb-2">
            Checkout
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-600 to-orange-700 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-200 p-8 hover:shadow-2xl transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Cart Items
                </h2>
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold">
                  {state.items.length} {state.items.length === 1 ? 'item' : 'items'}
                </div>
              </div>
              
              <div className="space-y-4">
                {state.items.map((item, index) => (
                  <div 
                    key={item._id} 
                    className={`group bg-gradient-to-r from-white to-amber-50/50 rounded-2xl p-6 border border-amber-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${itemsLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center">
                      <div className="relative overflow-hidden rounded-xl">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <div className="ml-6 flex-1">
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-amber-700 transition-colors">
                          {item.name}
                        </h3>
                        <div className="bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent font-bold text-lg">
                          ₹{item.price}/{item.unit}
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="flex items-center bg-white rounded-xl border-2 border-amber-200 shadow-sm hover:shadow-md transition-all duration-200">
                          <button
                            onClick={() => updateQuantity(item, item.quantity - 1)}
                            className="px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-l-xl transition-colors duration-200 font-bold text-lg"
                          >
                            −
                          </button>
                          <span className="px-4 py-2 border-x-2 border-amber-200 font-bold text-gray-700 min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            className="px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-r-xl transition-colors duration-200 font-bold text-lg"
                            disabled={item.quantity >= item.stock}
                          >
                            +
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeItem(item)}
                          className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-200 p-8 sticky top-24 hover:shadow-2xl transition-all duration-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 text-amber-600 mr-2" />
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-600 text-lg">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-lg items-center">
                  <span className="flex items-center">
                    <Truck className="w-4 h-4 mr-1" />
                    Shipping
                  </span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-amber-600' : ''}`}>
                    {shipping === 0 ? 'Free' : `₹${shipping}`}
                  </span>
                </div>
                <div className="border-t-2 border-amber-200 pt-4 flex justify-between font-bold text-xl">
                  <span className="text-gray-800">Total</span>
                  <span className="bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 text-amber-600 mr-2" />
                  Shipping Address
                </h3>
                
                <div className="space-y-3">
                  {/* Registered Address Option */}
                  {user?.address && (
                    <label className="group flex items-start space-x-3 p-4 rounded-xl border-2 border-amber-200 hover:border-amber-300 cursor-pointer transition-all duration-200 hover:bg-amber-50/50">
                      <input
                        type="radio"
                        name="address"
                        value="registered"
                        checked={useRegisteredAddress}
                        onChange={() => setUseRegisteredAddress(true)}
                        className="text-amber-600 focus:ring-amber-500 w-5 h-5 mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <MapPin className="w-4 h-4 text-amber-600 mr-2" />
                          <span className="font-medium text-gray-700 group-hover:text-amber-700">
                            Registered Address
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {formatAddress(user.address)}
                          {user.city && `, ${user.city}`}
                          {user.state && `, ${user.state}`}
                          {user.pincode && ` - ${user.pincode}`}
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Custom Address Option */}
                  <label className="group flex items-start space-x-3 p-4 rounded-xl border-2 border-amber-200 hover:border-amber-300 cursor-pointer transition-all duration-200 hover:bg-amber-50/50">
                    <input
                      type="radio"
                      name="address"
                      value="custom"
                      checked={!useRegisteredAddress}
                      onChange={() => setUseRegisteredAddress(false)}
                      className="text-amber-600 focus:ring-amber-500 w-5 h-5 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Plus className="w-4 h-4 text-amber-600 mr-2" />
                        <span className="font-medium text-gray-700 group-hover:text-amber-700">
                          Add New Address
                        </span>
                      </div>
                    </div>
                  </label>

                  {/* Custom Address Form */}
                  {!useRegisteredAddress && (
                    <div className="space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address *
                        </label>
                        <textarea
                          value={customAddress.address}
                          onChange={(e) => handleCustomAddressChange('address', e.target.value)}
                          placeholder="Enter your full address"
                          className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                          rows="3"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={customAddress.city}
                            onChange={(e) => handleCustomAddressChange('city', e.target.value)}
                            placeholder="City"
                            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            value={customAddress.state}
                            onChange={(e) => handleCustomAddressChange('state', e.target.value)}
                            placeholder="State"
                            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pincode *
                          </label>
                          <input
                            type="text"
                            value={customAddress.pincode}
                            onChange={(e) => handleCustomAddressChange('pincode', e.target.value)}
                            placeholder="6-digit pincode"
                            maxLength="6"
                            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={customAddress.phone}
                            onChange={(e) => handleCustomAddressChange('phone', e.target.value)}
                            placeholder="Phone number"
                            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 text-amber-600 mr-2" />
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <label className="group flex items-center space-x-3 p-4 rounded-xl border-2 border-amber-200 hover:border-amber-300 cursor-pointer transition-all duration-200 hover:bg-amber-50/50">
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-amber-600 focus:ring-amber-500 w-5 h-5"
                    />
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-amber-600 mr-2" />
                      <span className="font-medium text-gray-700 group-hover:text-amber-700">
                        Online Payment (RazorPay)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                onClick={handleProceedToPayment}
                disabled={isProcessing}
                className="group w-full bg-gradient-to-r from-amber-600 to-orange-700 text-white py-4 rounded-2xl font-bold hover:from-amber-700 hover:to-orange-800 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-xl flex items-center justify-center text-lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="mt-6 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-sm font-medium rounded-full">
                  <Truck className="w-4 h-4 mr-2" />
                  Free delivery on orders above ₹500
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;