import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../layouts/Layout';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminRoute from '../components/auth/AdminRoute';
import Home from '../pages/home/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import EmailVerification from '../pages/auth/EmailVerification';
import AdminLogin from '../pages/admin/Login';
import AdminRoutes from './AdminRoutes';
import CheckoutPage from '../pages/checkout/CheckoutPage';
import SearchResults from '../pages/SearchResults';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
        <Route path="verify-email/:token" element={<EmailVerification />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="search" element={<SearchResults />} />
      </Route>

      {/* Admin routes - separate layout */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminRoutes />
            </AdminLayout>
          </AdminRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes; 