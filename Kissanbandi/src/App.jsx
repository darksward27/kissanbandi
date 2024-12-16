import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from './pages/checkout/CartContext';
import Layout from './layouts/Layout';
import ProductCatalog from './pages/home/ProductCatalog';
import CheckoutPage from './pages/checkout/CheckoutPage';
import { Home } from './pages/home/Home';
import { AuthProvider } from './pages/checkout/AuthProvider';
import Login from './pages/Login';
import SignupDelivery from './pages/SignupDelivery';
import SearchResults from './pages/SearchResults';

export const App = () => {
  return (
    <AuthProvider>
    <CartProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignupDelivery />} />
              <Route path="/search" element={<SearchResults />} />
          </Routes>
        </Layout>
      </Router>
    </CartProvider>
    </AuthProvider>
  );
};

export default App;