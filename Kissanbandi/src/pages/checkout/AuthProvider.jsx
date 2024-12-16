import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setDeliveryDetails(null);
    localStorage.removeItem('user');
    localStorage.removeItem('deliveryDetails');
  };

  const updateDeliveryDetails = (details) => {
    setDeliveryDetails(details);
    localStorage.setItem('deliveryDetails', JSON.stringify(details));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      deliveryDetails, 
      updateDeliveryDetails 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);