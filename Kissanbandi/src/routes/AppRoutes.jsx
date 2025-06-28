import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../layouts/Layout';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminRoute from '../components/auth/AdminRoute';
import PrivateRoute from '../components/auth/PrivateRoute';

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
import Profile from '../pages/profile/Profile';
import Orders from '../pages/orders/Orders';
import Wishlist from '../pages/wishlist/Wishlist';

import SeasonalFruits from '../pages/fruits/seasonal';
import ExoticFruits from '../pages/fruits/ExoticFruits';
import FreshVegetables from '../pages/vegetables/FreshVegetables';
import OrganicFruits from '../pages/fruits/OrganicFruits';
import OrganicVegetables from '../pages/vegetables/OrganicVegetables';
import RootVegetables from '../pages/vegetables/RootVegetables';
import SeasonalVegetables from '../pages/vegetables/SeasonalVegetables';
import FruitsVeg from '../pages/vegetables/FruitsVeg';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
        <Route path="verify-email/:token" element={<EmailVerification />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="search" element={<SearchResults />} />

        {/* 🥦 Fruits & Vegetables routes */}
        <Route path="category/fruits/seasonal-fruits" element={<SeasonalFruits />} />
        <Route path="category/fruits/exotic-fruits" element={<ExoticFruits />} />
        <Route path="category/fruits/organic-fruits" element={<OrganicFruits />} />
        
        <Route path="category/vegetables/organic-vegetables" element={<OrganicVegetables />} />
        <Route path="category/vegetables/fresh-vegetables" element={<FreshVegetables />} />        
        <Route path="category/vegetables/seasonal-vegetables" element={<SeasonalFruits />} />
        <Route path="category/vegetables/root-vegetables" element={<RootVegetables/>} />
        <Route path="category/vegetables/fruits-veg" element={<FruitsVeg />} />

        {/* Protected Routes */}
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="orders"
          element={
            <PrivateRoute>
              <Orders />
            </PrivateRoute>
          }
        />
        <Route
          path="wishlist"
          element={
            <PrivateRoute>
              <Wishlist />
            </PrivateRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <PrivateRoute>
              <CheckoutPage />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Admin routes */}
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
