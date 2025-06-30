import React, { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingCart, Search, User, ChevronDown, LogOut, Home, Package, Heart } from "lucide-react";
import { useCart } from "../pages/checkout/CartContext";
import { useAuth } from "../pages/checkout/AuthProvider";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { allProducts } from "../data/products";
import Logo from "../components/Logo";

const Navbar = () => {
  const { state } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [activeDesktopDropdown, setActiveDesktopDropdown] = useState(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const cartCount = state.items.reduce((total, item) => total + item.quantity, 0);

  // Fixed search suggestions logic
  const suggestions = searchQuery.trim() && searchQuery.length > 0
    ? allProducts
        .filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Fixed click outside detection for search
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (!event.target.closest('.profile-menu')) {
        setShowProfileMenu(false);
      }
      if (!event.target.closest('.dropdown-container')) {
        setActiveDesktopDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setExpandedCategory(null);
    setActiveDesktopDropdown(null);
    setShowSuggestions(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (product) => {
    navigate(`/search?q=${encodeURIComponent(product.name)}`);
    setSearchQuery('');
    setShowSuggestions(false);
    setIsOpen(false);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length > 0) {
      setShowSuggestions(true);
    }
  };

  const categories = [
    {
      name: 'Fruits',
      icon: '🍎',
      subcategories: ['Seasonal Fruits', 'Exotic Fruits', 'Organic Fruits']
    },
    {
      name: 'Vegetables',
      icon: '🥕',
      subcategories: ['Fresh Vegetables', 'Organic Vegetables', 'Root Vegetables','Seasonal Vegetables','Fruits Veg']
    }
  ];

  const quickLinks = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Cart', icon: ShoppingCart, path: '/checkout', badge: cartCount },
    ...(isAuthenticated ? [
      { name: 'Orders', icon: Package, path: '/orders' },
      { name: 'Wishlist', icon: Heart, path: '/wishlist' },
    ] : [])
  ];

  const SearchInput = ({ isMobile = false }) => (
    <div 
      ref={searchContainerRef}
      className="relative w-full search-container animate-fadeIn" 
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSearch}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for fresh produce..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          onFocus={handleSearchFocus}
          className={`w-full px-6 py-3 rounded-full border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 focus:outline-none focus:border-red-400 focus:shadow-lg focus:shadow-red-200/50 transition-all duration-300 hover:border-red-300 hover:shadow-md hover:shadow-red-100/30 placeholder-red-600/70 hover:scale-[1.02] focus:scale-[1.02] ${
            isMobile ? 'text-sm' : ''
          }`}
        />
        <button 
          type="submit" 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-red-100 animate-pulse hover:animate-none"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 border border-red-100 overflow-hidden animate-slideInDown">
          {suggestions.map((product, index) => (
            <button
              key={product.id}
              onClick={() => handleSuggestionClick(product)}
              className="w-full px-6 py-3 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-gray-700 hover:text-red-700 flex items-center space-x-3 transition-all duration-200 border-b border-red-50 last:border-b-0 group hover:scale-[1.02] transform"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: `slideInLeft 0.3s ease-out ${index * 100}ms both`
              }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200 group-hover:rotate-12">
                <Search className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium block">{product.name}</span>
                {product.category && (
                  <span className="text-xs text-gray-500">{product.category}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    setIsOpen(false);
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  const toggleDesktopDropdown = (categoryName) => {
    setActiveDesktopDropdown(activeDesktopDropdown === categoryName ? null : categoryName);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Top bar with gradient - hidden on mobile */}
      <div className={`hidden md:block bg-gradient-to-r from-red-100 via-rose-100 to-red-100 transition-all duration-500 ${
        isScrolled ? 'h-0 overflow-hidden opacity-0' : 'py-3 opacity-100'
      }`}>
        <div className="container mx-auto px-4">
          <div className="text-sm text-red-800 text-center font-medium animate-bounce">
            🚚 Free delivery on orders above ₹500 | 📞 Support: +91 1234567890 ✨
          </div>
        </div>
      </div>

      {/* Main navbar with enhanced mobile design */}
      <nav className={`bg-gradient-to-r from-white via-red-50/80 to-white backdrop-blur-lg border-b-2 border-red-100 transition-all duration-500 ${
        isScrolled ? 'shadow-2xl shadow-red-200/20 bg-white/95 border-red-200' : 'shadow-lg'
      }`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className={`flex justify-between items-center transition-all duration-300 ${
            isScrolled ? 'h-14 md:h-16' : 'h-16 md:h-20'
          }`}>
            {/* Logo with responsive sizing */}
            <Link to="/" className="hover:opacity-90 transition-all duration-300 hover:scale-105 hover:drop-shadow-lg animate-fadeInLeft">
              <div className="p-1 md:p-2 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-300 border border-red-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-200/30">
                <Logo size={isScrolled ? "small" : "normal"} variant="horizontal" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 animate-fadeIn">
              {categories.map((category, index) => (
                <div key={category.name} className="relative dropdown-container" style={{animationDelay: `${index * 200}ms`}}>
                  <button 
                    onClick={() => toggleDesktopDropdown(category.name)}
                    className={`flex items-center space-x-2 font-medium px-4 py-2 rounded-full transition-all duration-300 hover:shadow-md hover:shadow-red-200/30 hover:scale-105 border-2 border-transparent hover:border-red-200 ${
                      activeDesktopDropdown === category.name 
                        ? 'text-red-600 bg-gradient-to-r from-red-50 to-rose-50 border-red-300 shadow-lg shadow-red-200/30' 
                        : 'text-gray-700 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50'
                    }`}
                  >
                    <span className="relative">
                      {category.name}
                      <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-300 ${
                        activeDesktopDropdown === category.name ? 'w-full' : 'w-0'
                      }`}></span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      activeDesktopDropdown === category.name ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className={`absolute top-full left-0 transition-all duration-300 ease-out ${
                    activeDesktopDropdown === category.name 
                      ? 'opacity-100 scale-100 translate-y-0' 
                      : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
                  }`}>
                    <div className="bg-white/95 backdrop-blur-lg shadow-2xl rounded-xl mt-2 py-3 w-56 border-2 border-red-100 overflow-hidden">
                      {category.subcategories.map((sub, index) => (
                        <Link
                          key={sub}
                          to={`/category/${category.name.toLowerCase()}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-200 hover:translate-x-2 border-l-4 border-transparent hover:border-red-400 hover:scale-[1.02] transform"
                          onClick={() => setActiveDesktopDropdown(null)}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Search bar */}
            <div className="hidden md:flex items-center flex-1 max-w-xl mx-8 animate-fadeIn" style={{animationDelay: '400ms'}}>
              <SearchInput />
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-3 md:space-x-6 animate-fadeInRight">
              {/* Desktop User section */}
              {isAuthenticated ? (
                <div className="relative profile-menu hidden md:block">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 md:space-x-3 text-gray-700 hover:text-red-600 p-1 md:p-2 rounded-full hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-300 hover:shadow-lg hover:shadow-red-200/30 hover:scale-105 border-2 border-transparent hover:border-red-200"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-red-100 to-rose-200 rounded-full flex items-center justify-center hover:from-red-200 hover:to-rose-300 transition-all duration-300 shadow-md border border-red-200 hover:animate-pulse">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-red-700" />
                    </div>
                    <span className="hidden lg:block font-medium text-sm">{user.name}</span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl py-2 z-50 border-2 border-red-100 overflow-hidden animate-slideInDown">
                      <Link
                        to="/profile"
                        className="block px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-200 hover:translate-x-2 hover:scale-[1.02] transform"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        👤 Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-200 hover:translate-x-2 hover:scale-[1.02] transform"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        📦 My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        className="block px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-200 hover:translate-x-2 hover:scale-[1.02] transform"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        💚 Wishlist
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-200 hover:translate-x-2 hover:scale-[1.02] transform"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          ⚙️ Admin Dashboard
                        </Link>
                      )}
                      <hr className="my-2 border-red-100" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-6 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-200 hover:translate-x-2 hover:scale-[1.02] transform"
                      >
                        <div className="flex items-center space-x-2">
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-red-600 hidden md:block px-4 py-2 rounded-full hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-300 font-medium hover:shadow-md hover:shadow-red-200/30 hover:scale-105 text-sm border-2 border-transparent hover:border-red-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 px-4 md:px-6 py-2 rounded-full transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:shadow-red-300/50 hover:scale-105 hover:-translate-y-0.5 text-sm hidden md:block border-2 border-red-400 hover:border-red-500"
                  >
                    Register
                  </Link>
                </>
              )}

              {/* Desktop Cart icon */}
              <Link to="/checkout" className="text-gray-700 hover:text-red-600 relative p-1 md:p-2 rounded-full hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-300 hover:shadow-lg hover:shadow-red-200/30 hover:scale-110 group hidden md:flex border-2 border-transparent hover:border-red-200">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 group-hover:animate-bounce" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-bold shadow-lg animate-pulse hover:animate-none hover:scale-110 transition-all duration-200 border border-red-400">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button
                className="md:hidden text-gray-700 hover:text-red-600 p-2 rounded-full hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-300 hover:scale-110 border-2 border-transparent hover:border-red-200"
                onClick={() => setIsOpen(!isOpen)}
              >
                <div className="relative w-6 h-6">
                  <Menu className={`w-6 h-6 absolute transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
                  <X className={`w-6 h-6 absolute transition-all duration-300 ${isOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search - always visible on mobile */}
        <div className="md:hidden px-4 pb-3">
          <SearchInput isMobile={true} />
        </div>

        {/* Enhanced Mobile menu with better UX */}
        <div
          className={`md:hidden bg-gradient-to-b from-white to-red-50/50 backdrop-blur-lg border-t-2 border-red-100 transition-all duration-500 overflow-hidden ${
            isOpen ? 'max-h-screen opacity-100 shadow-2xl' : 'max-h-0 opacity-0'
          }`}
        >
          {/* Quick Navigation Links */}
          <div className="px-4 py-4 border-b border-red-100/50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Access</div>
            <div className={`grid gap-2 ${isAuthenticated ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {quickLinks.map((link, index) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-300 group relative border-2 border-transparent hover:border-red-200 hover:scale-105 transform"
                  onClick={() => setIsOpen(false)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative">
                    <link.icon className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform duration-200 group-hover:rotate-12" />
                    {link.badge && link.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-lg border border-red-400">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 group-hover:text-red-700">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Categories with enhanced accordion */}
          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Categories</div>
            {categories.map((category, categoryIndex) => (
              <div key={category.name} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-300 group border-2 border-transparent hover:border-red-200 hover:scale-[1.02] transform"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-200 group-hover:rotate-12">{category.icon}</span>
                    <span className="font-semibold text-gray-800 group-hover:text-red-700">{category.name}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                    expandedCategory === category.name ? 'rotate-180 text-red-600' : ''
                  }`} />
                </button>
                
                {/* Subcategories with smooth animation */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  expandedCategory === category.name ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="ml-8 mt-2 space-y-1">
                    {category.subcategories.map((sub, index) => (
                      <Link
                        key={sub}
                        to={`/category/${category.name.toLowerCase()}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block py-3 px-4 text-sm text-gray-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-lg transition-all duration-300 hover:translate-x-2 hover:shadow-md border-l-4 border-transparent hover:border-red-400 hover:scale-[1.02] transform"
                        onClick={() => setIsOpen(false)}
                        style={{ 
                          animationDelay: expandedCategory === category.name ? `${index * 50}ms` : '0ms',
                          transform: expandedCategory === category.name ? 'translateY(0)' : 'translateY(-10px)'
                        }}
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile auth section with improved design */}
          <div className="border-t-2 border-red-200 py-4 px-4 bg-gradient-to-r from-red-50/50 to-rose-50/50">
            {isAuthenticated ? (
              <>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Account</div>
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 py-3 px-4 text-gray-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-lg transition-all duration-300 hover:translate-x-2 border-2 border-transparent hover:border-red-200 hover:scale-[1.02] transform"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-3 py-3 px-4 text-gray-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-lg transition-all duration-300 hover:translate-x-2 border-2 border-transparent hover:border-red-200 hover:scale-[1.02] transform"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="text-lg">⚙️</span>
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full py-3 px-4 text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-lg transition-all duration-300 hover:translate-x-2 mt-4 border-2 border-transparent hover:border-red-200 hover:scale-[1.02] transform"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Get Started</div>
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="block py-3 px-4 text-center text-gray-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-lg transition-all duration-300 font-medium border-2 border-red-200 hover:border-red-300 hover:scale-105 transform"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block py-3 px-4 text-center text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 border-2 border-red-400 hover:border-red-500 transform"
                    onClick={() => setIsOpen(false)}
                  >
                    Create Account
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-fadeInLeft {
          animation: fadeInLeft 0.6s ease-out;
        }

        .animate-fadeInRight {
          animation: fadeInRight 0.6s ease-out;
        }

        .animate-slideInDown {
          animation: slideInDown 0.3s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Navbar;