import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './pages/checkout/AuthProvider';
import CartProvider from './pages/checkout/CartContext';
import Seasonal from './pages/fruits/seasonal'; // Importing Seasonal component
import Home from './pages/Home/Home';
import { Layout } from 'lucide-react';
// import Home from './pages/Home';               // Example Home page

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" />
          
          {/* Adding Routes */}
          <Routes>
          <Route path="/" element={<Home />} />          {/* Default Home Page */}

            <Route path="/seasonal" element={<Seasonal />} />          {/* Default Home Page */}
            {/* <Route path="/seasonal" element={<Seasonal />} /> Seasonal Fruits Page */}
          </Routes>

        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
