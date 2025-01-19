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

  // Initialize auth state from localStorage and sessionStorage
  useEffect(() => {
    const initAuth = () => {
      console.log('Initializing auth state...');
      // Check localStorage first
      const token = localStorage.getItem('kissanbandi_token');
      const storedUser = localStorage.getItem('kissanbandi_user');
      const adminToken = localStorage.getItem('adminToken');
      const adminUser = localStorage.getItem('adminUser');

      // If not in localStorage, check sessionStorage
      const sessionToken = sessionStorage.getItem('kissanbandi_token');
      const sessionUser = sessionStorage.getItem('kissanbandi_user');
      const sessionAdminToken = sessionStorage.getItem('adminToken');
      const sessionAdminUser = sessionStorage.getItem('adminUser');

      console.log('Stored tokens:', {
        adminToken: !!adminToken || !!sessionAdminToken,
        userToken: !!token || !!sessionToken
      });

      if (adminToken && adminUser) {
        console.log('Found admin credentials in localStorage');
        const parsedUser = JSON.parse(adminUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      } else if (sessionAdminToken && sessionAdminUser) {
        console.log('Found admin credentials in sessionStorage');
        const parsedUser = JSON.parse(sessionAdminUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${sessionAdminToken}`;
      } else if (token && storedUser) {
        console.log('Found user credentials in localStorage');
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else if (sessionToken && sessionUser) {
        console.log('Found user credentials in sessionStorage');
        const parsedUser = JSON.parse(sessionUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
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

  const updateUser = async (userData) => {
    try {
      setUser(userData);
      
      // Check which storage type was used
      const isLocalStorage = localStorage.getItem('kissanbandi_token') || localStorage.getItem('adminToken');
      const storage = isLocalStorage ? localStorage : sessionStorage;
      
      // Update in the appropriate storage
      if (userData.role === 'admin') {
        storage.setItem('adminUser', JSON.stringify(userData));
      } else {
        storage.setItem('kissanbandi_user', JSON.stringify(userData));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
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
    checkSession,
    updateUser
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