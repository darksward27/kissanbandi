import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      console.log('Initializing auth state...');
      const token = localStorage.getItem('kissanbandi_token');
      const storedUser = localStorage.getItem('kissanbandi_user');
      const adminToken = localStorage.getItem('adminToken');
      const adminUser = localStorage.getItem('adminUser');

      console.log('Stored tokens:', {
        adminToken: !!adminToken,
        userToken: !!token
      });

      if (adminToken && adminUser) {
        console.log('Found admin credentials');
        const parsedUser = JSON.parse(adminUser);
        console.log('Admin user:', parsedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      } else if (token && storedUser) {
        console.log('Found user credentials');
        const parsedUser = JSON.parse(storedUser);
        console.log('Regular user:', parsedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        console.log('No stored credentials found');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Token refresh mechanism
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await api.post('/users/refresh-token');
        const { token } = response.data;
        
        if (user?.role === 'admin') {
          localStorage.setItem('adminToken', token);
        } else {
          localStorage.setItem('kissanbandi_token', token);
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        logout();
      }
    };

    if (isAuthenticated) {
      // Refresh token every 23 hours
      const interval = setInterval(refreshToken, 23 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/users/login', { email, password });
      const { token, user: userData } = response.data;

      setUser(userData);
      setIsAuthenticated(true);
      
      if (rememberMe) {
        localStorage.setItem('kissanbandi_token', token);
        localStorage.setItem('kissanbandi_user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('kissanbandi_token', token);
        sessionStorage.setItem('kissanbandi_user', JSON.stringify(userData));
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const adminLogin = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/users/admin/login', { email, password });
      const { token, user: userData } = response.data;

      if (userData.role !== 'admin') {
        throw new Error('Unauthorized access');
      }

      setUser(userData);
      setIsAuthenticated(true);

      if (rememberMe) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('adminUser', JSON.stringify(userData));
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('kissanbandi_token');
    localStorage.removeItem('kissanbandi_user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    sessionStorage.removeItem('kissanbandi_token');
    sessionStorage.removeItem('kissanbandi_user');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    delete api.defaults.headers.common['Authorization'];
    navigate('/');
  };

  const checkSession = async () => {
    try {
      const response = await api.get('/users/check-session');
      return response.data.valid;
    } catch (error) {
      logout();
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    adminLogin,
    logout,
    checkSession
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};