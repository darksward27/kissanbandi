import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, Search, User, ChevronDown, LogOut } from 'lucide-react';
import { useCart } from '../pages/checkout/CartContext';
import { useAuth } from '../pages/checkout/AuthProvider';
import { Link, useNavigate } from 'react-router-dom';
import { allProducts } from '../data/products';
import Logo from '../components/Logo';

const Navbar = () => {
  const { state } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const cartCount = state.items.reduce((total, item) => total + item.quantity, 0);

  // Filter suggestions based on search query
  const suggestions = searchQuery.trim() 
    ? allProducts
        .filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
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
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const categories = [
    {
      name: 'Fruits',
      subcategories: ['Seasonal Fruits', 'Exotic Fruits', 'Organic Fruits']
    },
    {
      name: 'Vegetables',
      subcategories: ['Fresh Vegetables', 'Organic Vegetables', 'Root Vegetables']
    }
  ];

  const SearchInput = ({ isMobile = false }) => (
    <div className="relative w-full search-container" onClick={(e) => e.stopPropagation()}>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for fresh produce..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-green-500"
        />
        <button 
          type="submit" 
          className="absolute right-4 top-2.5 text-gray-400 hover:text-green-500"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>
      
      {showSuggestions && searchQuery.trim() && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-50">
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSuggestionClick(product)}
              className="w-full px-4 py-2 text-left hover:bg-green-50 text-gray-700 hover:text-green-700 flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{product.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Top bar */}
      <div className={`hidden md:block bg-green-50 transition-all duration-300 ${
        isScrolled ? 'h-0 overflow-hidden' : 'py-2'
      }`}>
        <div className="container mx-auto px-4">
          <div className="text-sm text-green-800 text-center">
            Free delivery on orders above ₹500 | Support: +91 1234567890
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className={`bg-white shadow-lg transition-all duration-300 ${
        isScrolled ? 'shadow-md' : ''
      }`}>
        <div className="container mx-auto px-6">
          <div className={`flex justify-between items-center transition-all duration-300 ${
            isScrolled ? 'h-16' : 'h-20'
          }`}>
            {/* Logo */}
            <Link to="/" className="hover:opacity-90 transition-opacity duration-200 ml-8">
              <Logo size="normal" variant="horizontal" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {categories.map((category) => (
                <div key={category.name} className="relative group">
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600">
                    <span>{category.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="absolute top-full left-0 transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-in-out">
                    <div className="bg-white shadow-lg rounded-lg mt-2 py-2 w-48">
                      {category.subcategories.map((sub) => (
                        <Link
                          key={sub}
                          to={`/category/${category.name.toLowerCase()}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Search bar - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
              <SearchInput />
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-6">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-green-600"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="hidden md:block">{user.name}</span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Wishlist
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
                    className="text-gray-700 hover:text-green-600 hidden md:block"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-gray-700 hover:text-green-600"
                  >
                    Register
                  </Link>
                </>
              )}

              <Link to="/checkout" className="text-gray-700 hover:text-green-600 relative">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                className="md:hidden text-gray-700"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-4">
          <SearchInput isMobile={true} />
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden bg-white ${
            isOpen ? 'block' : 'hidden'
          } shadow-lg`}
        >
          {categories.map((category) => (
            <div key={category.name} className="px-4 py-2">
              <div className="font-medium text-gray-700">{category.name}</div>
              <div className="ml-4 mt-1">
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub}
                    to={`/category/${category.name.toLowerCase()}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block py-2 text-sm text-gray-600 hover:text-green-600"
                    onClick={() => setIsOpen(false)}
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Mobile auth links */}
          <div className="border-t border-gray-200 py-4 px-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block py-2 text-gray-600 hover:text-green-600"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/orders"
                  className="block py-2 text-gray-600 hover:text-green-600"
                  onClick={() => setIsOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  to="/wishlist"
                  className="block py-2 text-gray-600 hover:text-green-600"
                  onClick={() => setIsOpen(false)}
                >
                  Wishlist
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left py-2 text-red-600 hover:text-red-700"
                >
                  <div className="flex items-center space-x-2">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-600 hover:text-green-600"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-gray-600 hover:text-green-600"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;