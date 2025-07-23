// Enhanced Coupon API Service with Usage Tracking
const couponApi = {
  async getAvailableCoupons(cartTotal) {
    try {
      const token = sessionStorage.getItem('kissanbandi_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/coupons/available?cartTotal=${cartTotal}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch coupons`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Coupon API Error:', error);
      throw error;
    }
  },

  async validateCoupon(code, cartTotal, cartItems) {
    try {
      const token = sessionStorage.getItem('kissanbandi_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, cartTotal, cartItems })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Invalid coupon`);
      }
      
      return data;
    } catch (error) {
      console.error('Coupon Validation Error:', error);
      throw error;
    }
  },

  async getSuggestions(cartTotal, cartItems) {
    try {
      const token = sessionStorage.getItem('kissanbandi_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/coupons/suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cartTotal, cartItems })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to get suggestions`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Coupon Suggestions Error:', error);
      throw error;
    }
  },

  // ✅ NEW: Update coupon usage statistics after successful order
  async updateCouponUsage(couponId, orderData) {
    try {
      const token = sessionStorage.getItem('kissanbandi_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/coupons/${couponId}/usage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          userId: orderData.userId,
          discountAmount: orderData.discountAmount,
          orderTotal: orderData.orderTotal,
          usedAt: orderData.usedAt || new Date().toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to update coupon usage`);
      }

      console.log('✅ Coupon usage updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Coupon Usage Update Error:', error);
      throw error;
    }
  },

  // ✅ NEW: Get coupon usage statistics (optional - for admin dashboard)
  async getCouponStats(couponId) {
    try {
      const token = sessionStorage.getItem('kissanbandi_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/coupons/${couponId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch coupon stats`);
      }

      return await response.json();
    } catch (error) {
      console.error('Coupon Stats Error:', error);
      throw error;
    }
  },

  // ✅ NEW: Reserve coupon for order (prevents race conditions)
  async reserveCoupon(couponId, orderData) {
    try {
      const token = sessionStorage.getItem('kissanbandi_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/coupons/${couponId}/reserve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: orderData.userId,
          discountAmount: orderData.discountAmount,
          orderTotal: orderData.orderTotal,
          reservationTimeout: 600000 // 10 minutes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to reserve coupon`);
      }

      return data;
    } catch (error) {
      console.error('Coupon Reservation Error:', error);
      throw error;
    }
  },

  // ✅ NEW: Release coupon reservation (if payment fails)
  async releaseCouponReservation(couponId, reservationId) {
    try {
      const token = sessionStorage.getItem('kissanbandi_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/coupons/${couponId}/release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reservationId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to release coupon`);
      }

      return data;
    } catch (error) {
      console.error('Coupon Release Error:', error);
      throw error;
    }
  }
};

export default couponApi;