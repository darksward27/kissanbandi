import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Check for admin token first
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      return config;
    }

    // Then check for user token
    const userToken = localStorage.getItem('kissanbandi_token') || sessionStorage.getItem('kissanbandi_token');
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens on unauthorized
      localStorage.removeItem('adminToken');
      localStorage.removeItem('kissanbandi_token');
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('kissanbandi_token');
    }
    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  // Get all products with optional filters
  getAllProducts: async (filters = {}) => {
    try {
      console.log('Making API request to /products with filters:', filters);
      const timestamp = new Date().getTime();
      const response = await api.get('/products', { 
        params: { ...filters, _t: timestamp },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Full API response:', {
        status: response.status,
        headers: response.headers,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data)
      });
      
      // Handle different response structures
      let products;
      if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data && typeof response.data === 'object') {
        products = response.data.products || response.data.data || [];
      } else {
        products = [];
      }
      
      console.log('Processed products:', products);
      return products;
    } catch (error) {
      console.error('Error in getAllProducts:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create new product (admin only)
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Update product (admin only)
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product (admin only)
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Get products by category
  getProductsByCategory: async (category, subcategory = null) => {
    const params = { category };
    if (subcategory) params.subcategory = subcategory;
    const response = await api.get('/products/category', { params });
    return response.data;
  },

  // Search products
  searchProducts: async (query) => {
    const response = await api.get('/products/search', { params: { query } });
    return response.data;
  },

  // Get featured products
  getFeaturedProducts: async () => {
    const response = await api.get('/products/featured');
    return response.data;
  }
};

// Orders API
export const ordersApi = {
  getAllOrders: async () => {
    try {
      console.log('Fetching all orders...');
      const timestamp = new Date().getTime();
      const response = await api.get('/orders', {
        params: { _t: timestamp },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Orders API response:', {
        status: response.status,
        data: response.data
      });

      // Ensure we return an array
      const orders = Array.isArray(response.data) ? response.data :
                    Array.isArray(response.data?.orders) ? response.data.orders :
                    response.data?.data || [];
      
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },
  
  getOrdersByDateRange: async (startDate, endDate) => {
    try {
      console.log('Fetching orders by date range:', { startDate, endDate });
      const timestamp = new Date().getTime();
      const response = await api.get('/orders/date-range', {
        params: {
          startDate,
          endDate,
          _t: timestamp
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // Ensure we return an array
      const orders = Array.isArray(response.data) ? response.data :
                    Array.isArray(response.data?.orders) ? response.data.orders :
                    response.data?.data || [];
      
      return orders;
    } catch (error) {
      console.error('Error fetching orders by date range:', error);
      throw error;
    }
  },
  
  getOrderStats: async (startDate, endDate) => {
    try {
      console.log('Fetching order stats:', { startDate, endDate });
      const timestamp = new Date().getTime();
      const response = await api.get('/orders/stats', {
        params: {
          startDate,
          endDate,
          _t: timestamp
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        // Add timeout to prevent long waits
        timeout: 5000,
        // Allow endpoint to fail without breaking the app
        validateStatus: (status) => {
          return status < 500; // Resolve only if the status code is less than 500
        }
      });
      
      if (response.status === 404) {
        console.warn('Order stats endpoint not implemented');
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching order stats:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      // Return null to allow fallback to client-side calculation
      return null;
    }
  },
  
  updateOrderStatus: async (id, status) => {
    try {
      console.log('Updating order status:', { id, status });
      const response = await api.put(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },
  
  exportOrders: async (filters) => {
    try {
      console.log('Exporting orders with filters:', filters);
      const timestamp = new Date().getTime();
      const response = await api.get('/orders/export', {
        params: { ...filters, _t: timestamp },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting orders:', error);
      throw error;
    }
  }
};

// Users API
export const usersApi = {
  getAllCustomers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getCustomerById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  getCustomerOrders: async (id) => {
    const response = await api.get(`/users/${id}/orders`);
    return response.data;
  },
  
  getCustomerAnalytics: async (id) => {
    const response = await api.get(`/users/${id}/analytics`);
    return response.data;
  }
};

export default api; 