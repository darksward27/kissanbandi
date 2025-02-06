import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './pages/checkout/AuthProvider';
import CartProvider from './pages/checkout/CartContext';
import Home from './pages/Home/Home';
import SeasonalFruits from './pages/fruits/seasonal';
import ExoticFruits from './pages/fruits/ExoticFruits'; 
import OrganicFruits from './pages/fruits/OrganicFruits';
import FreshVegetables from './pages/vegetables/FreshVegetables';
import OrganicVegetables from './pages/vegetables/OrganicVegetables';
import RootVegetables from './pages/vegetables/RootVegetables';
import SeasonalVegetables from './pages/vegetables/SeasonalVegetables';
import FruitsVeg from './pages/vegetables/FruitsVeg';
// import Navbar from "./components/layouts/Navbar.jsx"
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/seasonalfruits" element={<SeasonalFruits />} />
            <Route path="/exoticfruits" element={<ExoticFruits />} /> 
            <Route path="/organicfruits" element={<OrganicFruits />} /> 
            <Route path="/organicvegetables" element={<OrganicVegetables />} /> 
            <Route path="/freshvegetables" element={<FreshVegetables />} /> 
            <Route path="/rootvegetables" element={<RootVegetables />} /> 
            <Route path="/seasonals" element={<SeasonalVegetables/>} />
            <Route path="/fruitsveg" element={<FruitsVeg/>} />
            
          </Routes>

        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;