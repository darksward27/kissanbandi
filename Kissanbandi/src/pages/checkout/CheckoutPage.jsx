import React, { useState, useEffect } from 'react';
import { useCart } from '../checkout/CartContext';
import { useAuth } from '../checkout/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Trash2, MapPin, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../services/api';

const CheckoutPage = () => {
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Show toast if cart is empty
    if (state.items.length === 0) {
      toast.error('Your cart is empty');
    }

    // Cleanup function
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.removeChild(script);
    };
  }, [state.items.length]);

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
    toast.success('Item removed from cart');
  };

  const calculateSubtotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  // Add this function to format address
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

  const handleProceedToPayment = async () => {
    try {
      if (!user) {
        navigate('/login');
        toast.error('Please login to continue');
        return;
      }

      if (!user.address) {
        toast.error('Please update your address in profile to proceed');
        navigate('/profile');
        return;
      }

      setIsProcessing(true);

      if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        const orderResponse = await ordersApi.createRazorpayOrder({
          amount: total
        });

        if (!orderResponse.orderId) {
          throw new Error('Failed to create order');
        }

        // Initialize Razorpay payment
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: total * 100,
          currency: "INR",
          name: "KissanBandi",
          description: "Purchase of fresh produce",
          order_id: orderResponse.orderId,
          handler: async function(response) {
            try {
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
                  shippingAddress: {
                    address: formatAddress(user.address),
                    city: user.city || '',
                    state: user.state || '',
                    pincode: user.pincode || '',
                    phone: user.phone || ''
                  },
                  shipping: subtotal > 500 ? 0 : 50
                }
              });

              if (verificationResponse.success) {
                toast.success('Payment successful!');
                dispatch({ type: 'CLEAR_CART' });
                navigate('/orders');
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || ''
          },
          theme: {
            color: "#16a34a"
          },
          modal: {
            ondismiss: function() {
              setIsProcessing(false);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
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
        shippingAddress: {
          address: formatAddress(user.address),
          city: user.city || '',
          state: user.state || '',
          pincode: user.pincode || '',
          phone: user.phone || ''
        },
        paymentMethod: 'cod'
      });

      if (response._id) {
        toast.success('Order placed successfully!');
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
      <div className="container mx-auto px-4 py-8 mt-32">
        <div className="max-w-md mx-auto text-center bg-white rounded-xl shadow-sm p-8">
          <div className="text-gray-400 mb-4">
            <ShoppingBag className="w-20 h-20 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
            Start shopping to add items to your cart.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition duration-200 inline-flex items-center"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Regular checkout view with items
  return (
    <div className="container mx-auto px-4 py-8 mt-32">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              Cart Items ({state.items.length})
            </h2>
            
            {state.items.map((item) => (
              <div key={item.id} className="flex items-center py-4 border-b">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.category}</p>
                  <div className="text-green-600 font-medium">
                    ₹{item.price}/{item.unit}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 border-x">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Select Payment Method</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600"
                  />
                  <span>Online Payment (RazorPay)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600"
                  />
                  <span>Cash on Delivery</span>
                </label>
              </div>
            </div>

            <button 
              onClick={handleProceedToPayment}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Proceed to Payment'}
            </button>

            <div className="mt-4 text-sm text-gray-500 text-center">
              Free delivery on orders above ₹500
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;